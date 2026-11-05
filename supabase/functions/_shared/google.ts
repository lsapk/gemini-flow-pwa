import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  appOrigin,
  collectGooglePages,
  decrypt,
  encrypt,
  GoogleError,
} from "./google-domain.ts";
import { HttpError, readText } from "./validation.ts";

export { GoogleError } from "./google-domain.ts";

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value)
    throw new GoogleError(
      503,
      "La connexion Google n’est pas encore configurée sur le serveur.",
      "not_configured",
    );
  return value;
}

export function config() {
  const origin = appOrigin(required("APP_URL"));
  const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
  return {
    origin,
    supabaseUrl,
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: required("GOOGLE_CLIENT_SECRET"),
    encryptionKey: required("GOOGLE_TOKEN_ENCRYPTION_KEY"),
    redirectUri: `${supabaseUrl}/functions/v1/google-oauth/callback`,
  };
}

export function admin() {
  return createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
      },
    },
  );
}

export type Admin = ReturnType<typeof admin>;

export async function store<T = unknown>(
  db: Admin,
  action: string,
  userId: string | null,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await db.rpc("google_store", {
    p_action: action,
    p_user_id: userId,
    p_payload: payload,
  });
  if (error)
    throw new GoogleError(
      500,
      "Impossible d’enregistrer la connexion Google. Vérifiez les migrations du serveur.",
      "storage_error",
    );
  return data as T;
}

export function cors(request: Request): HeadersInit {
  const origin = appOrigin(required("APP_URL"));
  return {
    ...(request.headers.get("Origin") === origin
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

export function json(request: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors(request), "Content-Type": "application/json" },
  });
}

export function failure(request: Request, error: unknown) {
  const known = error instanceof GoogleError;
  // Never return or log provider response bodies, tokens, authorization codes, or secrets.
  let headers: HeadersInit = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  try {
    headers = { ...headers, ...cors(request) };
  } catch {
    /* Server setup missing. */
  }
  return new Response(
    JSON.stringify({
      error: known
        ? error.message
        : "La connexion Google a rencontré un problème. Réessayez.",
      code: known ? error.code : "internal_error",
    }),
    {
      status: known ? error.status : 500,
      headers,
    },
  );
}

export async function authenticate(
  request: Request,
  db: Admin,
): Promise<string> {
  const origin = request.headers.get("Origin");
  if (origin && origin !== appOrigin(required("APP_URL")))
    throw new GoogleError(403, "Origine non autorisée.", "forbidden_origin");
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer "))
    throw new GoogleError(
      401,
      "Connectez-vous à Deepflow pour continuer.",
      "unauthorized",
    );
  const { data, error } = await db.auth.getUser(authorization.slice(7));
  if (error || !data.user || data.user.is_anonymous)
    throw new GoogleError(
      401,
      "Votre session a expiré. Reconnectez-vous à Deepflow.",
      "unauthorized",
    );
  return data.user.id;
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  let text: string;
  try {
    text = await readText(request, 4096);
  } catch (error) {
    throw new GoogleError(
      error instanceof HttpError ? error.status : 400,
      "Requête invalide ou trop volumineuse.",
      "invalid_request",
    );
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new GoogleError(400, "Requête invalide.", "invalid_request");
  }
}

export interface TokenBundle {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
export interface Connection {
  user_id: string;
  google_subject: string;
  account_email: string | null;
  tokens_cipher: string;
  scopes: string[];
  connected_at: string;
  last_pull_at: string | null;
  last_push_at: string | null;
  needs_reconnect: boolean;
}

export async function tokenRequest(
  parameters: Record<string, string>,
): Promise<Record<string, unknown>> {
  const settings = config();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      ...parameters,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 400 || response.status === 401)
      throw new GoogleError(
        401,
        "L’autorisation Google a expiré ou a été révoquée. Reconnectez ce compte.",
        "reconnect_required",
      );
    throw new GoogleError(
      502,
      "Google est momentanément indisponible. Réessayez plus tard.",
      "provider_unavailable",
    );
  }
  return await response.json();
}

export async function connection(
  db: Admin,
  userId: string,
): Promise<Connection> {
  const value = await store<Connection | null>(db, "connection_get", userId);
  if (!value)
    throw new GoogleError(
      409,
      "Connectez d’abord votre compte Google.",
      "not_connected",
    );
  return value;
}

export async function accessToken(
  db: Admin,
  userId: string,
  linked: Connection,
): Promise<string> {
  const settings = config();
  let tokens: TokenBundle;
  try {
    tokens = JSON.parse(
      await decrypt(
        linked.tokens_cipher,
        settings.encryptionKey,
        `tokens:${userId}:${linked.google_subject}`,
      ),
    );
  } catch {
    throw new GoogleError(
      503,
      "Les identifiants Google ne peuvent pas être déchiffrés. Contactez l’administrateur.",
      "encryption_error",
    );
  }
  if (tokens.expires_at > Date.now() + 60000) return tokens.access_token;
  try {
    const fresh = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    });
    if (
      typeof fresh.access_token !== "string" ||
      typeof fresh.expires_in !== "number"
    )
      throw new GoogleError(502, "Réponse Google invalide.", "provider_error");
    tokens = {
      access_token: fresh.access_token,
      refresh_token:
        typeof fresh.refresh_token === "string"
          ? fresh.refresh_token
          : tokens.refresh_token,
      expires_at: Date.now() + fresh.expires_in * 1000,
    };
    await store(db, "tokens_update", userId, {
      subject: linked.google_subject,
      tokens_cipher: await encrypt(
        JSON.stringify(tokens),
        settings.encryptionKey,
        `tokens:${userId}:${linked.google_subject}`,
      ),
    });
    return tokens.access_token;
  } catch (error) {
    if (error instanceof GoogleError && error.code === "reconnect_required")
      await store(db, "connection_error", userId);
    throw error;
  }
}

export async function googleFetch<T>(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new GoogleError(
        401,
        "Votre autorisation Google n’est plus valide. Reconnectez ce compte.",
        "reconnect_required",
      );
    if (response.status === 403)
      throw new GoogleError(
        403,
        "Google refuse cet accès. Vérifiez les autorisations du compte et l’activation des API Calendar et Tasks.",
        "permission_denied",
      );
    if (response.status === 404 || response.status === 410)
      throw new GoogleError(
        404,
        "Cette ressource Google a été supprimée ou n’est plus accessible.",
        "resource_not_found",
      );
    if (response.status === 409)
      throw new GoogleError(
        409,
        "Cet événement existe déjà. Actualisez l’agenda.",
        "resource_exists",
      );
    if (response.status === 412)
      throw new GoogleError(
        409,
        "Cet événement a changé dans Google. Actualisez l’agenda avant de réessayer.",
        "event_conflict",
      );
    if (response.status === 429)
      throw new GoogleError(
        429,
        "La limite Google est atteinte. Patientez avant de réessayer.",
        "rate_limited",
      );
    throw new GoogleError(
      502,
      "Google n’a pas pu traiter la demande. Les transferts déjà enregistrés sont conservés ; vous pouvez réessayer.",
      "provider_error",
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

export async function googlePages<T>(
  token: string,
  baseUrl: string,
  maxItems = 20000,
): Promise<T[]> {
  const deadline = Date.now() + 45000;
  return collectGooglePages<T>(async (pageToken) => {
    if (Date.now() > deadline)
      throw new GoogleError(
        504,
        "Google met trop de temps à répondre. Réessayez le transfert.",
        "provider_timeout",
      );
    const url = new URL(baseUrl);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    return googleFetch<{ items?: T[]; nextPageToken?: string }>(
      token,
      url.href,
    );
  }, maxItems);
}
