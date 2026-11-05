import {
  accessToken,
  admin,
  authenticate,
  body,
  config,
  connection,
  cors,
  failure,
  googleFetch,
  googlePages,
  GoogleError,
  json,
  store,
  type Connection,
  type TokenBundle,
} from "../_shared/google.ts";
import {
  calendarEventFields,
  calendarRange,
  decrypt,
  eventRequestId,
  eventVersion,
  exportTask,
  importTask,
  resourceId,
  sha256,
  taskFingerprint,
  taskMarker,
  type LocalTask,
  type RemoteTask,
} from "../_shared/google-domain.ts";

interface TaskMap {
  local_task_id: string;
  google_task_id: string;
  remote_updated: string | null;
  local_fingerprint: string | null;
}
const batchSize = 40;

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  etag?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  htmlLink?: string;
  status?: string;
  attendees?: unknown[];
  eventType?: string;
  recurringEventId?: string;
  extendedProperties?: { private?: Record<string, string> };
}
function publicEvent(event: CalendarEvent) {
  return {
    id: event.id,
    summary: event.summary || "Événement sans titre",
    description: event.description || "",
    location: event.location || "",
    start: event.start,
    end: event.end,
    etag: event.etag || null,
    editable:
      !event.attendees?.length &&
      (!event.eventType || event.eventType === "default"),
    recurring: Boolean(event.recurringEventId),
    htmlLink:
      event.htmlLink?.startsWith("https://www.google.com/calendar/") ||
      event.htmlLink?.startsWith("https://calendar.google.com/")
        ? event.htmlLink
        : null,
  };
}

async function syncTasks(
  db: ReturnType<typeof admin>,
  userId: string,
  linked: Connection,
  token: string,
  listId: string,
  direction: "pull" | "push",
) {
  const deadline = Date.now() + 90000;
  const baseUrl = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`;
  // Include completed/hidden items: first-party Google clients hide completed tasks by default.
  const remote = await googlePages<RemoteTask>(
    token,
    `${baseUrl}?maxResults=100&showCompleted=true&showHidden=true&showDeleted=true`,
    20000,
  );
  const maps = await store<TaskMap[]>(db, "maps_get", userId, {
    subject: linked.google_subject,
    list_id: listId,
  });
  const byRemote = new Map(maps.map((map) => [map.google_task_id, map]));
  const byLocal = new Map(maps.map((map) => [map.local_task_id, map]));
  let transferred = 0;
  let remaining = 0;
  let skippedDeleted = 0;

  if (direction === "pull") {
    for (const task of remote) {
      if (task.deleted) {
        skippedDeleted++;
        continue;
      }
      const mapping = byRemote.get(task.id);
      if (mapping && task.updated && mapping.remote_updated === task.updated)
        continue;
      if (transferred >= batchSize || Date.now() > deadline) {
        remaining++;
        continue;
      }
      const fields = importTask(task);
      const hint = task.notes?.match(
        new RegExp(`\\[deepflow:${userId}:([0-9a-f-]{36})\\]`, "i"),
      )?.[1];
      await store<string>(db, "task_import", userId, {
        subject: linked.google_subject,
        list_id: listId,
        remote_id: task.id,
        remote_updated: task.updated || null,
        fields,
        local_hint: hint || null,
        fingerprint: await taskFingerprint({ id: "", ...fields }),
      });
      transferred++;
    }
  } else {
    // Read all owned tasks with pagination; never silently truncate at PostgREST's row limit.
    const local: LocalTask[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from("tasks")
        .select("id,title,description,due_date,completed")
        .eq("user_id", userId)
        .order("id")
        .range(offset, offset + 499);
      if (error)
        throw new GoogleError(
          500,
          "Impossible de charger vos tâches Deepflow.",
          "storage_error",
        );
      local.push(...(data || []));
      if ((data || []).length < 500) break;
      if (local.length >= 20000)
        throw new GoogleError(
          413,
          "Votre espace contient trop de tâches pour un transfert en une opération.",
          "list_too_large",
        );
    }
    const remoteById = new Map(
      remote.filter((task) => !task.deleted).map((task) => [task.id, task]),
    );
    // A stable marker recovers an INSERT whose Google response arrived but whose DB write failed.
    const byMarker = new Map<string, RemoteTask>();
    for (const task of remote.filter((entry) => !entry.deleted)) {
      const match = task.notes?.match(
        new RegExp(`\\[deepflow:${userId}:([0-9a-f-]{36})\\]`, "i"),
      );
      if (match) byMarker.set(match[1], task);
    }
    for (const task of local) {
      const mapping = byLocal.get(task.id);
      const fingerprint = await taskFingerprint(task);
      if (mapping?.local_fingerprint === fingerprint) continue;
      if (transferred >= batchSize || Date.now() > deadline) {
        remaining++;
        continue;
      }
      const existing =
        (mapping && remoteById.get(mapping.google_task_id)) ||
        byMarker.get(task.id);
      if (existing?.assignmentInfo)
        throw new GoogleError(
          409,
          "Une tâche attribuée depuis Google Docs ou Chat ne peut pas être modifiée ici. Modifiez-la dans son application d’origine.",
          "assigned_task",
        );
      const payload = exportTask(task, userId);
      // The marker is metadata inside notes, not a secret, and is scoped to this Deepflow user.
      if (!payload.notes.includes(taskMarker(userId, task.id)))
        throw new Error("Missing marker");
      const updated = await googleFetch<RemoteTask>(
        token,
        existing ? `${baseUrl}/${encodeURIComponent(existing.id)}` : baseUrl,
        {
          method: existing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      await store(db, "map_save", userId, {
        subject: linked.google_subject,
        list_id: listId,
        remote_id: updated.id,
        local_id: task.id,
        remote_updated: updated.updated || null,
        fingerprint,
      });
      transferred++;
    }
  }
  await store(db, "sync_complete", userId, { direction });
  return { direction, transferred, remaining, skippedDeleted };
}

Deno.serve(async (request: Request) => {
  let release: (() => Promise<void>) | undefined;
  let requireReconnect: (() => Promise<void>) | undefined;
  try {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(request) });
    if (request.method !== "POST")
      throw new GoogleError(
        405,
        "Méthode non autorisée.",
        "method_not_allowed",
      );
    const db = admin();
    const userId = await authenticate(request, db);
    const input = await body(request);
    if (input.action === "status") {
      try {
        config();
      } catch {
        return json(request, { configured: false, connected: false });
      }
      const linked = await store<Connection | null>(
        db,
        "connection_get",
        userId,
      );
      return json(request, {
        configured: true,
        connected: Boolean(linked),
        ...(linked
          ? {
              accountEmail: linked.account_email,
              connectedAt: linked.connected_at,
              lastPullAt: linked.last_pull_at,
              lastPushAt: linked.last_push_at,
              needsReconnect: linked.needs_reconnect,
              canEditCalendar: linked.scopes.includes(
                "https://www.googleapis.com/auth/calendar.events",
              ),
            }
          : {}),
      });
    }
    const settings = config();
    if (
      ![
        "complete",
        "disconnect",
        "resources",
        "calendars",
        "events",
        "event_create",
        "event_update",
        "event_delete",
        "tasklists",
        "pull",
        "push",
      ].includes(String(input.action))
    )
      throw new GoogleError(400, "Action invalide.", "invalid_action");

    // Serialize token refresh, task transfers, reconnect confirmation and disconnect for a user.
    const lease = crypto.randomUUID();
    if (!(await store<boolean>(db, "lock_acquire", userId, { lease })))
      throw new GoogleError(
        409,
        "Un transfert est déjà en cours. Patientez quelques instants.",
        "sync_in_progress",
      );
    release = async () => {
      await store(db, "lock_release", userId, { lease });
    };
    if (input.action === "complete") {
      const confirmation = input.confirmation;
      if (
        typeof confirmation !== "string" ||
        !/^[a-zA-Z0-9_-]{43}$/.test(confirmation)
      )
        throw new GoogleError(
          400,
          "Confirmation Google invalide.",
          "invalid_confirmation",
        );
      const completed = await store<boolean>(db, "pending_confirm", userId, {
        confirmation_hash: await sha256(confirmation),
      });
      if (!completed)
        throw new GoogleError(
          400,
          "Cette autorisation a expiré ou appartient à une autre session Deepflow. Recommencez la connexion.",
          "invalid_confirmation",
        );
      return json(request, { connected: true });
    }

    const linked = await connection(db, userId);
    requireReconnect = async () => {
      await store(db, "connection_error", userId);
    };
    if (input.action === "disconnect") {
      const tokens: TokenBundle = JSON.parse(
        await decrypt(
          linked.tokens_cipher,
          settings.encryptionKey,
          `tokens:${userId}:${linked.google_subject}`,
        ),
      );
      const revoked = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: tokens.refresh_token }),
        signal: AbortSignal.timeout(15000),
      });
      // Google's 400 means an already-invalid token. Other failures remain visible and retryable.
      if (!revoked.ok && revoked.status !== 400)
        throw new GoogleError(
          502,
          "Google n’a pas confirmé la révocation. Réessayez pour déconnecter ce compte.",
          "revoke_failed",
        );
      await store(db, "disconnect", userId);
      return json(request, { connected: false });
    }
    const token = await accessToken(db, userId, linked);
    if (input.action === "resources") {
      const [calendars, tasklists] = await Promise.all([
        googlePages<{
          id: string;
          summary: string;
          primary?: boolean;
          accessRole?: string;
        }>(
          token,
          "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&minAccessRole=reader",
          2000,
        ),
        googlePages<{ id: string; title: string }>(
          token,
          "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100",
          2000,
        ),
      ]);
      return json(request, {
        calendars: calendars.map(({ id, summary, primary, accessRole }) => ({
          id,
          summary,
          primary: Boolean(primary),
          writable: accessRole === "owner" || accessRole === "writer",
        })),
        tasklists: tasklists.map(({ id, title }) => ({ id, title })),
      });
    }
    if (input.action === "calendars") {
      const calendars = await googlePages<{
        id: string;
        summary: string;
        primary?: boolean;
        accessRole?: string;
      }>(
        token,
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&minAccessRole=reader",
        2000,
      );
      return json(request, {
        calendars: calendars.map(({ id, summary, primary, accessRole }) => ({
          id,
          summary,
          primary: Boolean(primary),
          writable: accessRole === "owner" || accessRole === "writer",
        })),
      });
    }
    if (input.action === "events") {
      const calendarId = resourceId(input.calendarId);
      const { start, end } = calendarRange(input.timeMin, input.timeMax);
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      );
      url.search = new URLSearchParams({
        timeMin: start,
        timeMax: end,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      }).toString();
      const events = await googlePages<CalendarEvent>(token, url.href, 5000);
      return json(request, {
        events: events
          .filter((event) => event.status !== "cancelled")
          .map(publicEvent),
      });
    }
    if (
      ["event_create", "event_update", "event_delete"].includes(
        String(input.action),
      )
    ) {
      if (
        !linked.scopes.includes(
          "https://www.googleapis.com/auth/calendar.events",
        )
      )
        throw new GoogleError(
          409,
          "Reconnectez Google pour autoriser la modification des événements.",
          "calendar_scope_required",
        );
      const calendarId = resourceId(input.calendarId);
      const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      if (input.action === "event_create") {
        const requestId = eventRequestId(input.requestId);
        const fields = calendarEventFields(input.event);
        const id = `df${requestId}`;
        try {
          const event = await googleFetch<CalendarEvent>(token, baseUrl, {
            method: "POST",
            body: JSON.stringify({
              ...fields,
              id,
              extendedProperties: {
                private: {
                  deepflowOwner: userId,
                  deepflowRequestId: requestId,
                },
              },
            }),
          });
          return json(request, { event: publicEvent(event) });
        } catch (error) {
          if (
            !(error instanceof GoogleError) ||
            error.code !== "resource_exists"
          )
            throw error;
          // A retry after a lost network response retrieves the same event, never a duplicate.
          const existing = await googleFetch<CalendarEvent>(
            token,
            `${baseUrl}/${id}`,
          );
          if (
            existing.extendedProperties?.private?.deepflowOwner !== userId ||
            existing.extendedProperties?.private?.deepflowRequestId !==
              requestId
          )
            throw error;
          const sameTime = (
            left: { date?: string; dateTime?: string },
            right: { date?: string; dateTime?: string },
          ) =>
            left.date
              ? left.date === right.date
              : Boolean(
                  left.dateTime &&
                  right.dateTime &&
                  Date.parse(left.dateTime) === Date.parse(right.dateTime),
                );
          if (
            existing.summary !== fields.summary ||
            (existing.description || "") !== fields.description ||
            (existing.location || "") !== fields.location ||
            !sameTime(existing.start, fields.start) ||
            !sameTime(existing.end, fields.end)
          ) {
            throw new GoogleError(
              409,
              "Cet événement a déjà été créé avec un autre contenu. Fermez ce formulaire et actualisez l’agenda avant de le modifier.",
              "event_already_created",
            );
          }
          return json(request, { event: publicEvent(existing) });
        }
      }
      const eventId = resourceId(input.eventId);
      const version = eventVersion(input.etag);
      const eventUrl = `${baseUrl}/${encodeURIComponent(eventId)}`;
      const existing = await googleFetch<CalendarEvent>(token, eventUrl);
      if (
        existing.attendees?.length ||
        (existing.eventType && existing.eventType !== "default")
      )
        throw new GoogleError(
          409,
          "Ouvrez cet événement dans Google pour gérer les invités ou un type d’événement spécial.",
          "event_requires_google",
        );
      if (input.action === "event_delete") {
        await googleFetch<void>(token, eventUrl, {
          method: "DELETE",
          headers: { "If-Match": version },
        });
        return json(request, { deleted: true });
      }
      const event = await googleFetch<CalendarEvent>(token, eventUrl, {
        method: "PATCH",
        headers: { "If-Match": version },
        body: JSON.stringify(calendarEventFields(input.event)),
      });
      return json(request, { event: publicEvent(event) });
    }
    if (input.action === "tasklists") {
      return json(request, {
        tasklists: await googlePages<{ id: string; title: string }>(
          token,
          "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100",
          2000,
        ),
      });
    }
    const result = await syncTasks(
      db,
      userId,
      linked,
      token,
      resourceId(input.listId),
      input.action as "pull" | "push",
    );
    return json(request, result);
  } catch (error) {
    if (
      error instanceof GoogleError &&
      error.code === "reconnect_required" &&
      requireReconnect
    ) {
      try {
        await requireReconnect();
      } catch {
        /* The provider failure remains visible if storage is unavailable. */
      }
    }
    return failure(request, error);
  } finally {
    if (release) {
      try {
        await release();
      } catch {
        /* Lease expires if the database is unavailable. */
      }
    }
  }
});
