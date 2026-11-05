// Runtime-independent boundaries, also exercised by Node's built-in test runner.
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks",
] as const;

export class GoogleError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "google_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function appOrigin(value: string): string {
  const url = new URL(value);
  if (
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "APP_URL must be an HTTPS origin (HTTP localhost is allowed).",
    );
  }
  return url.origin;
}

export function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function unbase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(
    atob(value.replaceAll("-", "+").replaceAll("_", "/")),
    (char) => char.charCodeAt(0),
  );
}

export function randomSecret(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function sha256(value: string): Promise<string> {
  return base64url(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  );
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  const bytes = unbase64(secret);
  if (bytes.length !== 32)
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY must contain 32 random bytes, base64 encoded.",
    );
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  value: string,
  secret: string,
  context: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(context) },
    await encryptionKey(secret),
    new TextEncoder().encode(value),
  );
  return `${base64url(iv)}.${base64url(new Uint8Array(ciphertext))}`;
}

export async function decrypt(
  value: string,
  secret: string,
  context: string,
): Promise<string> {
  const [iv, ciphertext, extra] = value.split(".");
  if (!iv || !ciphertext || extra) throw new Error("Invalid encrypted token.");
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: unbase64(iv),
      additionalData: new TextEncoder().encode(context),
    },
    await encryptionKey(secret),
    unbase64(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export function hasRequiredScopes(scopes: string[]): boolean {
  // Google normalizes the email alias in its token response.
  return (
    GOOGLE_SCOPES.filter((scope) => scope !== "email").every((scope) =>
      scopes.includes(scope),
    ) &&
    (scopes.includes("email") ||
      scopes.includes("https://www.googleapis.com/auth/userinfo.email"))
  );
}

export function resourceId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value ||
    /^\.+$/.test(value) ||
    value.length > 1024 ||
    /[\x00-\x1f]/.test(value)
  ) {
    throw new GoogleError(
      400,
      "Sélectionnez un agenda ou une liste valide.",
      "invalid_resource",
    );
  }
  return value;
}

export interface CalendarEventFields {
  summary: string;
  description: string;
  location: string;
  start: { date: string } | { dateTime: string };
  end: { date: string } | { dateTime: string };
}

function eventDate(value: unknown): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return NaN;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === value
    ? parsed
    : NaN;
}

function eventInstant(value: unknown): number {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    return NaN;
  if (
    !Number.isFinite(eventDate(value.slice(0, 10))) ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    Number(value.slice(17, 19)) > 59
  )
    return NaN;
  return Date.parse(value);
}

/** Only personal, explicit event fields are accepted: no invitations, ACLs or URLs. */
export function calendarEventFields(value: unknown): CalendarEventFields {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new GoogleError(400, "Événement invalide.", "invalid_event");
  const input = value as Record<string, unknown>;
  const text = (name: string, maximum: number, required = false) => {
    const item = input[name] ?? "";
    if (
      typeof item !== "string" ||
      item.length > maximum ||
      (required && !item.trim())
    )
      throw new GoogleError(
        400,
        "Renseignez un titre et des horaires valides. Le titre est limité à 200 caractères.",
        "invalid_event",
      );
    return item.trim();
  };
  const start = input.start as Record<string, unknown> | undefined;
  const end = input.end as Record<string, unknown> | undefined;
  const allDay = typeof start?.date === "string";
  const beginning = allDay
    ? eventDate(start?.date)
    : eventInstant(start?.dateTime);
  const ending = allDay ? eventDate(end?.date) : eventInstant(end?.dateTime);
  if (
    !Number.isFinite(beginning) ||
    !Number.isFinite(ending) ||
    ending <= beginning ||
    ending - beginning > 367 * 86400000 ||
    (allDay && (start?.dateTime || end?.dateTime)) ||
    (!allDay && (start?.date || end?.date))
  ) {
    throw new GoogleError(
      400,
      "La fin doit suivre le début. Utilisez des dates valides et, pour un horaire, un fuseau explicite.",
      "invalid_event_dates",
    );
  }
  return {
    summary: text("summary", 200, true),
    description: text("description", 2000),
    location: text("location", 200),
    start: allDay
      ? { date: start!.date as string }
      : { dateTime: start!.dateTime as string },
    end: allDay
      ? { date: end!.date as string }
      : { dateTime: end!.dateTime as string },
  };
}

export function calendarRange(startValue?: unknown, endValue?: unknown) {
  const start =
    startValue === undefined ? Date.now() : eventInstant(startValue);
  const end =
    endValue === undefined ? start + 14 * 86400000 : eventInstant(endValue);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    end - start > 93 * 86400000
  )
    throw new GoogleError(
      400,
      "Choisissez une période valide de 93 jours au maximum.",
      "invalid_date_range",
    );
  return {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
  };
}

export function eventVersion(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 256 ||
    !/^"[^"\r\n]+"$/.test(value)
  )
    throw new GoogleError(
      400,
      "Actualisez l’agenda avant de modifier cet événement.",
      "missing_event_version",
    );
  return value;
}

export function eventRequestId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{32}$/.test(value))
    throw new GoogleError(
      400,
      "Identifiant de création invalide.",
      "invalid_request_id",
    );
  return value;
}

export interface RemoteTask {
  id: string;
  title?: string;
  notes?: string;
  due?: string;
  status?: string;
  updated?: string;
  deleted?: boolean;
  assignmentInfo?: unknown;
}

export interface LocalTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

export function taskMarker(userId: string, taskId: string): string {
  return `[deepflow:${userId}:${taskId}]`;
}

export function removeMarker(notes: string): string {
  return notes
    .replace(/\n?\[deepflow:[0-9a-f-]{36}:[0-9a-f-]{36}\]/gi, "")
    .trimEnd();
}

export function importTask(task: RemoteTask) {
  if (!task.id || task.deleted)
    throw new GoogleError(
      400,
      "Cette tâche Google a été supprimée.",
      "deleted_task",
    );
  return {
    title: task.title?.trim() || "Tâche Google sans titre",
    description: removeMarker(task.notes || "") || null,
    due_date: task.due?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null,
    completed: task.status === "completed",
  };
}

export function exportTask(task: LocalTask, userId: string) {
  const marker = taskMarker(userId, task.id);
  if (
    task.title.length > 1024 ||
    (task.description || "").length + marker.length + 1 > 8192
  ) {
    throw new GoogleError(
      400,
      "Une tâche dépasse les limites Google : titre 1 024 caractères, notes 8 192 caractères.",
      "task_too_long",
    );
  }
  const date = task.due_date?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return {
    title: task.title,
    notes: `${removeMarker(task.description || "")}\n${marker}`.trim(),
    due: date ? `${date}T00:00:00.000Z` : null,
    status: task.completed ? "completed" : "needsAction",
    ...(task.completed ? {} : { completed: null }),
  };
}

export async function taskFingerprint(task: LocalTask): Promise<string> {
  return sha256(
    JSON.stringify([
      task.title,
      task.description || null,
      task.due_date?.slice(0, 10) || null,
      task.completed,
    ]),
  );
}

export function cookieValue(
  header: string | null,
  name: string,
): string | null {
  const value = header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value && /^[a-zA-Z0-9_-]{43}$/.test(value) ? value : null;
}

export async function collectGooglePages<T>(
  fetchPage: (
    pageToken?: string,
  ) => Promise<{ items?: T[]; nextPageToken?: string }>,
  maxItems: number,
): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;
  const seen = new Set<string>();
  do {
    const page = await fetchPage(pageToken);
    items.push(...(page.items || []));
    pageToken = page.nextPageToken;
    if (
      items.length > maxItems ||
      seen.size >= 220 ||
      (pageToken && seen.has(pageToken))
    ) {
      throw new GoogleError(
        413,
        "Cette liste est trop volumineuse pour un transfert. Choisissez une liste plus courte.",
        "list_too_large",
      );
    }
    if (pageToken) seen.add(pageToken);
  } while (pageToken);
  return items;
}
