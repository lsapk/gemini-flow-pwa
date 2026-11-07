import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  calendarWeek,
  localDay,
  useCalendarData,
} from "@/hooks/useCalendarData";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  deleteGoogleEvent,
  getGoogleEvents,
  getGoogleResources,
  getGoogleStatus,
  type GoogleEvent,
} from "@/services/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarEventEditor } from "@/components/CalendarEventEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Cette action n’a pas pu aboutir. Réessayez.";
}
function displayDay(date: string) {
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
function eventTiming(event: GoogleEvent) {
  if (event.start.date)
    return `${displayDay(event.start.date)} · Toute la journée`;
  return new Date(event.start.dateTime!).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [date, setDate] = useState(() => localDay(new Date()));
  const [calendarId, setCalendarId] = useState("");
  const [editor, setEditor] = useState<{ event?: GoogleEvent } | null>(null);
  const [deleting, setDeleting] = useState<GoogleEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedDate = new Date(`${date}T12:00:00`);
  const { start, end } = calendarWeek(selectedDate);
  const local = useCalendarData(selectedDate);
  const status = useQuery({
    queryKey: ["google-status", user?.id],
    queryFn: getGoogleStatus,
    enabled: Boolean(user) && isSupabaseConfigured,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const connected = status.data?.connected && !status.data.needsReconnect;
  const resources = useQuery({
    queryKey: ["google-resources", user?.id],
    queryFn: getGoogleResources,
    enabled: Boolean(connected),
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  const selectedCalendar =
    calendarId ||
    resources.data?.calendars.find((calendar) => calendar.primary)?.id ||
    resources.data?.calendars[0]?.id ||
    "";
  const calendar = resources.data?.calendars.find(
    (item) => item.id === selectedCalendar,
  );
  const events = useQuery({
    queryKey: [
      "google-events",
      user?.id,
      selectedCalendar,
      start.toISOString(),
      end.toISOString(),
    ],
    queryFn: () =>
      getGoogleEvents(selectedCalendar, start.toISOString(), end.toISOString()),
    enabled:
      Boolean(connected && selectedCalendar) &&
      !resources.isFetching &&
      !busy &&
      !editor,
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  const working = busy || events.isFetching || resources.isFetching;
  const canWrite = calendar?.writable && status.data?.canEditCalendar;

  function moveWeek(delta: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta * 7);
    setDate(localDay(next));
  }
  async function refresh() {
    setError("");
    await Promise.all([
      local.reload(),
      client.invalidateQueries({ queryKey: ["google-status", user?.id] }),
      client.invalidateQueries({ queryKey: ["google-events", user?.id] }),
    ]);
  }
  async function saved() {
    setEditor(null);
    setNotice("Votre événement est enregistré dans Google.");
    await client.invalidateQueries({ queryKey: ["google-events", user?.id] });
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await deleteGoogleEvent(selectedCalendar, deleting);
      setDeleting(null);
      setNotice("L’événement a été supprimé de Google.");
      await client.invalidateQueries({ queryKey: ["google-events", user?.id] });
    } catch (problem) {
      setError(message(problem));
    } finally {
      setBusy(false);
    }
  }
  const problem =
    error ||
    (status.error && message(status.error)) ||
    (resources.error && message(resources.error)) ||
    (events.error && message(events.error)) ||
    (local.error && message(local.error));
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="page-intro flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Votre semaine</p>
          <h1 className="page-title">Calendrier</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Vos rendez-vous et vos échéances, dans un même espace.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          disabled={working}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${working ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </header>
      <section
        className="calendar-toolbar panel flex flex-wrap items-center justify-between gap-4 p-4"
        aria-label="Choisir la semaine"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Semaine précédente"
            onClick={() => moveWeek(-1)}
            disabled={working}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Semaine du{" "}
            {start.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Semaine suivante"
            onClick={() => moveWeek(1)}
            disabled={working}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="calendar-date" className="sr-only">
            Date à afficher
          </Label>
          <Input
            id="calendar-date"
            type="date"
            className="w-auto"
            value={date}
            required
            onChange={(event) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value))
                setDate(event.target.value);
            }}
          />
          <Button variant="ghost" onClick={() => setDate(localDay(new Date()))}>
            Aujourd’hui
          </Button>
        </div>
      </section>
      {problem && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel min-w-0 p-5 md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Google Calendar</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Horaires : {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/connections">Gérer la connexion</Link>
            </Button>
          </div>
          {status.isLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              Chargement de la connexion…
            </p>
          ) : status.isError || status.data?.configured === false ? (
            <div className="rounded-xl border border-dashed p-7">
              <h3 className="font-medium">Connexion Google indisponible</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vos échéances Deepflow restent disponibles. L’état de
                l’intégration est indiqué dans Connexions.
              </p>
            </div>
          ) : !connected ? (
            <div className="rounded-xl border border-dashed p-7 text-center">
              <CalendarDays className="mx-auto mb-3 h-7 w-7 text-primary" />
              <h3 className="font-medium">
                {status.data?.needsReconnect
                  ? "Reconnecter votre agenda"
                  : "Retrouvez vos rendez-vous Google"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Connectez votre compte depuis la page Connexions pour consulter
                et gérer vos événements.
              </p>
              <Button className="mt-5" asChild>
                <Link to="/connections">Ouvrir les connexions</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="calendar-google">Agenda</Label>
                  <Select
                    value={selectedCalendar}
                    onValueChange={setCalendarId}
                    disabled={working}
                  >
                    <SelectTrigger id="calendar-google">
                      <SelectValue
                        placeholder={
                          resources.isLoading
                            ? "Chargement…"
                            : "Choisir un agenda"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.data?.calendars.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.summary}
                          {!item.writable ? " · lecture seule" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={!canWrite || working}
                  onClick={() => {
                    setNotice("");
                    setEditor({});
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Événement
                </Button>
              </div>
              {!status.data?.canEditCalendar && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Reconnectez Google depuis Connexions pour autoriser la
                  modification des événements.
                </p>
              )}
              {calendar && !calendar.writable && (
                <p className="mb-4 text-xs text-muted-foreground">
                  Cet agenda est en lecture seule pour votre compte Google.
                </p>
              )}
              {events.isFetching ? (
                <p
                  role="status"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Chargement des événements…
                </p>
              ) : events.data?.events.length ? (
                <ol className="divide-y">
                  {events.data.events.map((event) => (
                    <li key={event.id} className="py-5">
                      <p className="text-xs text-muted-foreground">
                        {eventTiming(event)}
                      </p>
                      <h3 className="mt-2 break-words font-medium">
                        {event.summary}
                      </h3>
                      {event.location && (
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                          {event.location}
                        </p>
                      )}
                      {event.recurring && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Occurrence d’un événement récurrent
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {canWrite && event.editable && event.etag && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={working}
                              onClick={() => setEditor({ event })}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={working}
                              onClick={() => {
                                setError("");
                                setDeleting(event);
                              }}
                            >
                              Supprimer
                            </Button>
                          </>
                        )}
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Ouvrir dans Google{" "}
                            <ExternalLink className="h-3 w-3" />
                            <span className="sr-only">
                              {" "}
                              : {event.summary} (nouvel onglet)
                            </span>
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : !events.error && selectedCalendar ? (
                <p className="rounded-xl border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">
                  Aucun rendez-vous Google cette semaine.
                </p>
              ) : null}
              <p className="mt-5 text-xs leading-5 text-muted-foreground">
                Les événements avec invités et les types spéciaux se gèrent dans
                Google. Aucune invitation n’est envoyée depuis Deepflow.
              </p>
            </>
          )}
        </section>
        <section className="panel min-w-0 p-5 md:p-7">
          <h2 className="text-xl font-semibold">Échéances Deepflow</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Vos tâches et objectifs datés. Ces éléments restent dans Deepflow.
          </p>
          {local.isLoading ? (
            <p role="status" className="py-8 text-sm text-muted-foreground">
              Chargement des échéances…
            </p>
          ) : local.items.length ? (
            <ol className="mt-5 divide-y">
              {local.items.map((item) => (
                <li key={`${item.type}-${item.id}`} className="py-4">
                  <p className="text-xs text-muted-foreground">
                    {displayDay(item.date)} ·{" "}
                    {item.type === "task" ? "Tâche" : "Objectif"}
                  </p>
                  <Link
                    to={item.type === "task" ? "/tasks" : "/goals"}
                    className={`mt-2 inline-block text-sm font-medium hover:underline ${item.completed ? "text-muted-foreground line-through" : ""}`}
                  >
                    {item.title}
                  </Link>
                  {item.completed && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Terminé
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            !local.error && (
              <p className="mt-6 rounded-xl bg-muted/40 p-5 text-sm text-muted-foreground">
                Aucune échéance cette semaine. Ajoutez une date à une tâche pour
                la retrouver ici.
              </p>
            )
          )}
          <Button variant="outline" className="mt-5" asChild>
            <Link to="/tasks">Voir mes tâches</Link>
          </Button>
        </section>
      </div>
      {editor && calendar && (
        <CalendarEventEditor
          key={editor.event?.id || "new"}
          calendarId={selectedCalendar}
          calendarName={calendar.summary}
          date={date}
          event={editor.event}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.summary} » sera supprimé de votre agenda Google.
              {deleting?.recurring
                ? " Seule cette occurrence est concernée."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Suppression…" : "Supprimer de Google"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
