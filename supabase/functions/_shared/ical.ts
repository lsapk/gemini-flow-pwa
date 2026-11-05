import { authenticate, endpoint, HttpError, json, jsonBody, text } from "./http.ts";
import { readText } from "./validation.ts";

export function calendarFeedUrl(value: unknown, configuredHosts: string | undefined): URL {
  const raw = text(value, "url", 3000);
  const hosts = (configuredHosts ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length || hosts.some((host) => !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host) || host.endsWith(".localhost") || host.endsWith(".local"))) throw new HttpError(503, "L’import par URL n’est pas configuré. Importez un fichier ICS.");
  let url: URL;
  try { url = new URL(raw); } catch { throw new HttpError(400, "Adresse de calendrier invalide."); }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.port || !hosts.includes(url.hostname)) throw new HttpError(400, "Ce serveur de calendrier n’est pas autorisé. Utilisez un export ICS ou contactez le support.");
  return url;
}

export const icalHandler = endpoint(async (req) => {
  await authenticate(req);
  const body = await jsonBody(req, 4096);
  const url = calendarFeedUrl(body.url, Deno.env.get("ICS_ALLOWED_HOSTS"));
  let upstream: Response;
  try {
    upstream = await fetch(url, { redirect: "error", headers: { Accept: "text/calendar, text/plain;q=0.5", "User-Agent": "Deepflow-Calendar/1.0" }, signal: AbortSignal.timeout(12000) });
  } catch { throw new HttpError(502, "Le calendrier est inaccessible. Vérifiez le lien ou importez un fichier ICS."); }
  if (!upstream.ok) { await upstream.body?.cancel(); throw new HttpError(502, "Le serveur universitaire ne peut pas fournir ce calendrier."); }
  let content: string;
  try { content = await readText(upstream, 2 * 1024 * 1024); }
  catch { throw new HttpError(413, "Le calendrier dépasse 2 Mio. Choisissez une période plus courte."); }
  if (!content.replace(/^\uFEFF/, "").trimStart().startsWith("BEGIN:VCALENDAR") || !content.includes("END:VCALENDAR")) throw new HttpError(400, "Ce lien ne renvoie pas un calendrier ICS. Exportez le calendrier depuis votre ENT.");
  return json(req, { content });
});
