import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export interface GoogleConnectionStatus {
  configured: boolean;
  connected: boolean;
  accountEmail?: string | null;
  connectedAt?: string;
  lastPullAt?: string | null;
  lastPushAt?: string | null;
  needsReconnect?: boolean;
  canEditCalendar?: boolean;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
  writable: boolean;
}
export interface GoogleTaskList {
  id: string;
  title: string;
}
export interface GoogleEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  htmlLink: string | null;
  description: string;
  location: string;
  etag: string | null;
  editable: boolean;
  recurring: boolean;
}
export interface GoogleEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { date: string } | { dateTime: string };
  end: { date: string } | { dateTime: string };
}
export interface GoogleSyncResult {
  direction: "pull" | "push";
  transferred: number;
  remaining: number;
  skippedDeleted: number;
}

export class GoogleConnectionError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

async function invoke<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!isSupabaseConfigured)
    throw new GoogleConnectionError(
      "Configurez Supabase pour connecter votre compte Google.",
      "not_configured",
    );
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    if ("context" in error && error.context instanceof Response) {
      const status = error.context.status;
      try {
        const details = await error.context.json();
        if (
          status === 404 &&
          ["NOT_FOUND", "FUNCTION_NOT_FOUND"].includes(details.code)
        ) {
          throw new GoogleConnectionError(
            "L’intégration Google n’est pas encore activée sur cette version de Deepflow.",
            "function_missing",
          );
        }
        if (typeof details.error === "string")
          throw new GoogleConnectionError(
            details.error,
            String(details.code || "request_failed"),
          );
      } catch (detailsError) {
        if (detailsError instanceof GoogleConnectionError) throw detailsError;
      }
      if (status === 401) {
        throw new GoogleConnectionError(
          "Votre session Deepflow a expiré. Reconnectez-vous, puis réessayez.",
          "session_expired",
        );
      }
    }
    throw new GoogleConnectionError(
      "Deepflow ne peut pas joindre le service Google. Réessayez ou ouvrez Connexions pour vérifier son état.",
      "request_failed",
    );
  }
  return data as T;
}

export const getGoogleStatus = () =>
  invoke<GoogleConnectionStatus>("google-api", { action: "status" });
export const startGoogleConnection = () =>
  invoke<{ url: string }>("google-oauth", { action: "start" });
export const completeGoogleConnection = (confirmation: string) =>
  invoke<{ connected: boolean }>("google-api", {
    action: "complete",
    confirmation,
  });
export const disconnectGoogle = () =>
  invoke<{ connected: boolean }>("google-api", { action: "disconnect" });
export const getGoogleResources = () =>
  invoke<{ calendars: GoogleCalendar[]; tasklists: GoogleTaskList[] }>(
    "google-api",
    { action: "resources" },
  );
export const getGoogleEvents = (
  calendarId: string,
  timeMin?: string,
  timeMax?: string,
) =>
  invoke<{ events: GoogleEvent[] }>("google-api", {
    action: "events",
    calendarId,
    ...(timeMin && timeMax ? { timeMin, timeMax } : {}),
  });
export const createGoogleEvent = (
  calendarId: string,
  event: GoogleEventInput,
  requestId: string,
) =>
  invoke<{ event: GoogleEvent }>("google-api", {
    action: "event_create",
    calendarId,
    event,
    requestId,
  });
export const updateGoogleEvent = (
  calendarId: string,
  event: GoogleEvent,
  fields: GoogleEventInput,
) =>
  invoke<{ event: GoogleEvent }>("google-api", {
    action: "event_update",
    calendarId,
    eventId: event.id,
    etag: event.etag,
    event: fields,
  });
export const deleteGoogleEvent = (calendarId: string, event: GoogleEvent) =>
  invoke<{ deleted: boolean }>("google-api", {
    action: "event_delete",
    calendarId,
    eventId: event.id,
    etag: event.etag,
  });
export const syncGoogleTasks = (direction: "pull" | "push", listId: string) =>
  invoke<GoogleSyncResult>("google-api", { action: direction, listId });
