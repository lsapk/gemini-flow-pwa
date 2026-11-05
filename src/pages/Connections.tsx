import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CalendarDays,
  Check,
  CheckCheck,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  completeGoogleConnection,
  disconnectGoogle,
  getGoogleEvents,
  getGoogleResources,
  getGoogleStatus,
  startGoogleConnection,
  syncGoogleTasks,
  type GoogleEvent,
  type GoogleSyncResult,
} from "@/services/google";

const callbackMessages: Record<string, string> = {
  denied:
    "Vous avez annulé l’autorisation Google. Vous pouvez réessayer quand vous le souhaitez.",
  incomplete:
    "Toutes les autorisations nécessaires n’ont pas été accordées. Reconnectez Google et autorisez Calendar ainsi que Tasks.",
  invalid_state:
    "Cette demande de connexion a expiré ou ne correspond plus à ce navigateur. Recommencez la connexion.",
  failed:
    "Google n’a pas pu finaliser la connexion. Vérifiez la configuration du serveur, puis réessayez.",
};

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Une erreur est survenue. Réessayez.";
}
function lastSync(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Aucun transfert";
}
function eventTime(event: GoogleEvent) {
  if (event.start.date) return "Toute la journée";
  return event.start.dateTime
    ? new Date(event.start.dateTime).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Horaire non précisé";
}
function eventDay(event: GoogleEvent) {
  const start =
    event.start.dateTime ||
    (event.start.date ? `${event.start.date}T12:00:00` : null);
  return start
    ? new Date(start).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";
}

export default function Connections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmationStarted = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<GoogleSyncResult | null>(null);
  const [calendarId, setCalendarId] = useState("");
  const [listId, setListId] = useState("");

  const status = useQuery({
    queryKey: ["google-status", user?.id],
    queryFn: getGoogleStatus,
    enabled: isSupabaseConfigured && Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const connected = status.data?.connected === true;
  const resources = useQuery({
    queryKey: ["google-resources", user?.id],
    queryFn: getGoogleResources,
    enabled: connected && !busy && !status.data?.needsReconnect,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });
  const selectedCalendar =
    calendarId ||
    resources.data?.calendars.find((calendar) => calendar.primary)?.id ||
    resources.data?.calendars[0]?.id ||
    "";
  const selectedList = listId || resources.data?.tasklists[0]?.id || "";
  const events = useQuery({
    queryKey: ["google-events", user?.id, selectedCalendar],
    queryFn: () => getGoogleEvents(selectedCalendar),
    enabled:
      connected &&
      Boolean(selectedCalendar) &&
      !busy &&
      !resources.isFetching &&
      !status.data?.needsReconnect,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });
  const working = Boolean(busy) || resources.isFetching || events.isFetching;

  useEffect(() => {
    const callback = searchParams.get("google");
    if (
      !callback ||
      confirmationStarted.current ||
      !user ||
      !isSupabaseConfigured
    )
      return;
    confirmationStarted.current = true;
    const confirmation = searchParams.get("confirmation");
    // Remove the short-lived confirmation key before rendering links or invoking Google again.
    setSearchParams({}, { replace: true });
    if (callback !== "ready" || !confirmation) {
      setError(
        callbackMessages[callback] ||
          "La connexion Google n’a pas été finalisée.",
      );
      return;
    }
    setBusy("complete");
    completeGoogleConnection(confirmation)
      .then(async () => {
        queryClient.removeQueries({ queryKey: ["google-resources", user.id] });
        queryClient.removeQueries({ queryKey: ["google-events", user.id] });
        setCalendarId("");
        setListId("");
        setNotice(
          "Votre compte Google est connecté. Choisissez un agenda et une liste de tâches.",
        );
        await queryClient.invalidateQueries({
          queryKey: ["google-status", user.id],
        });
      })
      .catch((problem) => setError(errorMessage(problem)))
      .finally(() => setBusy(null));
  }, [searchParams, setSearchParams, user, queryClient]);

  async function connect() {
    setBusy("connect");
    setError(null);
    setNotice(null);
    try {
      const { url } = await startGoogleConnection();
      // Only navigate to the configured Supabase server's OAuth bridge.
      const target = new URL(url);
      const configuredServer = new URL(import.meta.env.VITE_SUPABASE_URL);
      if (
        target.origin !== configuredServer.origin ||
        !target.pathname.endsWith("/functions/v1/google-oauth/authorize")
      )
        throw new Error("Adresse de connexion Google invalide.");
      window.location.assign(target.href);
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    setError(null);
    setResult(null);
    try {
      await disconnectGoogle();
      queryClient.removeQueries({ queryKey: ["google-resources", user?.id] });
      queryClient.removeQueries({ queryKey: ["google-events", user?.id] });
      setCalendarId("");
      setListId("");
      await queryClient.invalidateQueries({
        queryKey: ["google-status", user?.id],
      });
      setNotice(
        "Google est déconnecté et son autorisation a été révoquée. Vos tâches Deepflow sont conservées.",
      );
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setBusy(null);
    }
  }

  async function transfer(direction: "pull" | "push") {
    if (!selectedList) return;
    setBusy(direction);
    setError(null);
    setNotice(null);
    setResult(null);
    try {
      const outcome = await syncGoogleTasks(direction, selectedList);
      setResult(outcome);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["google-status", user?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      ]);
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Votre espace, connecté
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Connexions
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Retrouvez vos rendez-vous et faites circuler vos tâches entre Google
            et Deepflow, à votre rythme.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit gap-2 rounded-full px-3 py-1.5 font-normal"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Autorisation sécurisée
        </Badge>
      </header>

      {!isSupabaseConfigured && (
        <Alert>
          <AlertTitle>Connecter votre espace</AlertTitle>
          <AlertDescription>
            La connexion Google sera disponible une fois Supabase configuré.
            Ajoutez les paramètres du projet dans le fichier d’environnement.
          </AlertDescription>
        </Alert>
      )}
      {status.isPending && isSupabaseConfigured && (
        <div aria-label="Chargement de la connexion" className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      )}
      {(error || status.error) && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Une action est nécessaire</AlertTitle>
          <AlertDescription>
            {error || errorMessage(status.error)}
            {status.error && (
              <Button
                variant="outline"
                size="sm"
                className="ml-3 mt-2"
                onClick={() => void status.refetch()}
              >
                Réessayer
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert role="status">
          <CheckCheck className="h-4 w-4" />
          <AlertTitle>C’est prêt</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {result && (
        <Alert role="status">
          <Check className="h-4 w-4" />
          <AlertTitle>
            {result.transferred === 0
              ? "Vos tâches sont à jour"
              : `${result.transferred} tâche${result.transferred > 1 ? "s" : ""} ${result.direction === "pull" ? "importée" : "envoyée"}${result.transferred > 1 ? "s" : ""}`}
          </AlertTitle>
          <AlertDescription>
            {result.remaining > 0
              ? `${result.remaining} changement${result.remaining > 1 ? "s" : ""} restant${result.remaining > 1 ? "s" : ""}. Relancez le même transfert pour continuer.`
              : "Tous les changements de cette liste ont été traités."}
            {result.skippedDeleted > 0 &&
              " Les suppressions Google ne suppriment pas vos tâches Deepflow."}
          </AlertDescription>
        </Alert>
      )}

      {(!status.isPending || !isSupabaseConfigured) && (
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center md:p-8">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background text-xl font-semibold"
                aria-hidden="true"
              >
                G
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold">Google Workspace</h2>
                  <Badge
                    variant={connected ? "secondary" : "outline"}
                    className="rounded-full font-normal"
                  >
                    {connected ? "Connecté" : "Non connecté"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {connected
                    ? status.data?.accountEmail || "Votre compte Google"
                    : "Google Calendar et Google Tasks"}
                </p>
              </div>
            </div>
            {connected ? (
              <Button
                variant="outline"
                onClick={() => void disconnect()}
                disabled={working}
                className="shrink-0 gap-2"
              >
                {busy === "disconnect" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                Déconnecter
              </Button>
            ) : (
              <Button
                onClick={() => void connect()}
                disabled={
                  !isSupabaseConfigured ||
                  !user ||
                  status.data?.configured === false ||
                  Boolean(busy) ||
                  Boolean(status.error)
                }
                className="shrink-0 gap-2"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Connecter Google
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="border-t bg-muted/30 px-6 py-4 text-xs leading-5 text-muted-foreground md:px-8">
            Consulte vos agendas, crée et modifie vos événements personnels ;
            lit et met à jour vos tâches Google. Les accès sont révocables à
            tout moment. Aucune synchronisation ne démarre sans votre action.
          </div>
        </section>
      )}

      {status.data?.configured === false && (
        <Alert>
          <AlertTitle>La connexion Google est en préparation</AlertTitle>
          <AlertDescription>
            Google n’est pas encore activé pour cet espace. Vous pouvez
            continuer à utiliser vos tâches et votre calendrier Deepflow.
          </AlertDescription>
        </Alert>
      )}
      {status.data?.needsReconnect && (
        <Alert>
          <AlertTitle>Renouveler l’autorisation</AlertTitle>
          <AlertDescription>
            Google a expiré ou révoqué votre accès.{" "}
            <Button
              size="sm"
              variant="outline"
              disabled={working}
              onClick={() => void connect()}
              className="ml-2"
            >
              Reconnecter Google
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {connected &&
        !status.data?.needsReconnect &&
        !status.data?.canEditCalendar && (
          <Alert>
            <AlertTitle>Gérer vos événements Google</AlertTitle>
            <AlertDescription>
              Votre ancienne autorisation permet uniquement la lecture des
              événements. Reconnectez Google pour autoriser leur création et
              leur modification.
              <Button
                size="sm"
                variant="outline"
                disabled={working}
                onClick={() => void connect()}
                className="ml-2 mt-2"
              >
                Renouveler l’autorisation Google
              </Button>
            </AlertDescription>
          </Alert>
        )}
      {resources.error && (
        <Alert variant="destructive">
          <AlertTitle>Impossible de charger Google</AlertTitle>
          <AlertDescription>
            {errorMessage(resources.error)}
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void resources.refetch()}
                disabled={working}
              >
                Réessayer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void connect()}
                disabled={working}
              >
                Reconnecter Google
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {connected && !status.data?.needsReconnect && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <section className="rounded-2xl border bg-card p-6 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <CalendarDays
                  className="mb-4 h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <h2 className="text-xl font-semibold tracking-tight">
                  Votre agenda
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les 14 prochains jours, en un regard.
                </p>
                <Link
                  to="/calendar"
                  className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Ouvrir le calendrier
                </Link>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Actualiser les événements Google"
                disabled={working || !selectedCalendar}
                onClick={() => void events.refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {resources.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : resources.data?.calendars.length ? (
              <div className="space-y-2">
                <Label htmlFor="google-calendar">Agenda à afficher</Label>
                <Select
                  value={selectedCalendar}
                  onValueChange={setCalendarId}
                  disabled={working}
                >
                  <SelectTrigger id="google-calendar">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.data.calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.summary}
                        {calendar.primary ? " · Principal" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun agenda accessible sur ce compte.
              </p>
            )}
            <div className="mt-6" aria-live="polite">
              {events.isFetching ? (
                <div
                  className="space-y-3"
                  aria-label="Chargement des événements"
                >
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : events.error ? (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage(events.error)}
                </p>
              ) : events.data?.events.length ? (
                <ol className="max-h-[420px] divide-y overflow-y-auto pr-1">
                  {events.data.events.map((event) => (
                    <li key={event.id} className="flex items-start gap-4 py-4">
                      <div className="w-24 shrink-0">
                        <p className="text-xs capitalize text-muted-foreground">
                          {eventDay(event)}
                        </p>
                        <p className="mt-1 text-xs font-medium">
                          {eventTime(event)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">
                          {event.summary}
                        </p>
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Ouvrir dans Google
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
              ) : selectedCalendar && !resources.isFetching ? (
                <div className="rounded-xl border border-dashed px-5 py-10 text-center">
                  <CalendarDays
                    className="mx-auto mb-3 h-6 w-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">
                    Un peu d’espace devant vous
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aucun événement prévu dans les 14 prochains jours.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 md:p-8">
            <CheckCheck
              className="mb-4 h-5 w-5 text-primary"
              aria-hidden="true"
            />
            <h2 className="text-xl font-semibold tracking-tight">
              Vos tâches, à jour
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Choisissez une liste et le sens du transfert. Titres, notes,
              échéances et états terminés sont pris en compte.
            </p>
            <div className="mt-6 space-y-2">
              <Label htmlFor="google-tasklist">Liste Google Tasks</Label>
              {resources.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : resources.data?.tasklists.length ? (
                <Select
                  value={selectedList}
                  onValueChange={(value) => {
                    setListId(value);
                    setResult(null);
                  }}
                  disabled={working}
                >
                  <SelectTrigger id="google-tasklist">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.data.tasklists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  Créez d’abord une liste dans Google Tasks, puis actualisez
                  cette page.
                </p>
              )}
            </div>
            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                className="h-auto w-full justify-between py-4"
                disabled={working || !selectedList}
                onClick={() => void transfer("pull")}
              >
                <span className="flex items-center gap-3">
                  {busy === "pull" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="h-4 w-4" />
                  )}
                  Importer depuis Google
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                className="h-auto w-full justify-between py-4"
                disabled={working || !selectedList}
                onClick={() => void transfer("push")}
              >
                <span className="flex items-center gap-3">
                  {busy === "push" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4" />
                  )}
                  Envoyer vers Google
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Importer remplace les champs des tâches liées qui ont changé dans
              Google. Envoyer transfère toutes vos tâches Deepflow nouvelles ou
              modifiées vers la liste choisie. Les suppressions et la hiérarchie
              des sous-tâches ne sont pas propagées. Chaque clic traite jusqu’à
              40 changements.
            </p>
            <div className="mt-6 space-y-3 border-t pt-5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dernier import</span>
                <span>{lastSync(status.data?.lastPullAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dernier envoi</span>
                <span>{lastSync(status.data?.lastPushAt)}</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
