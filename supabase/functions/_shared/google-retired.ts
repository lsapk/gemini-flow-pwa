import { admin, authenticate, cors, failure, GoogleError } from "./google.ts";

export async function retiredGoogleOAuth(request: Request): Promise<Response> {
  try {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(request) });
    if (request.method === "POST") await authenticate(request, admin());
    throw new GoogleError(
      410,
      "Cette ancienne connexion Google a été remplacée. Ouvrez Connexions dans Deepflow et reconnectez votre compte.",
      "legacy_google_retired",
    );
  } catch (error) {
    return failure(request, error);
  }
}
