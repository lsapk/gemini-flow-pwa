import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FormEvent,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, Check, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  remainingFocusSeconds,
  pauseFocus,
  resumeFocus,
  readFocusSession,
  type FocusSessionState,
} from "@/lib/focus-session";
import { toast } from "sonner";
export default function Focus() {
  const { user } = useAuth();
  const key = `deepflow_focus_v2_${user!.id}`;
  const [session, setSession] = useState<FocusSessionState | null>(() => {
    try {
      return readFocusSession(localStorage.getItem(key), user!.id);
    } catch {
      return null;
    }
  });
  const [seconds, setSeconds] = useState(
      session ? remainingFocusSeconds(session) : 25 * 60,
    ),
    [duration, setDuration] = useState(25),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  const client = useQueryClient();
  const stats = useQuery({
    queryKey: ["focus-stats", user?.id],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const result = await supabase
        .from("focus_sessions")
        .select("duration")
        .eq("user_id", user!.id)
        .gte("completed_at", since.toISOString());
      if (result.error) throw result.error;
      return {
        count: result.data.length,
        minutes: result.data.reduce((sum, item) => sum + item.duration, 0),
      };
    },
  });
  useEffect(() => {
    try {
      if (session) localStorage.setItem(key, JSON.stringify(session));
      else localStorage.removeItem(key);
    } catch {
      setError(
        "Le navigateur ne permet pas de mémoriser le minuteur. Gardez cet onglet ouvert.",
      );
    }
  }, [session, key]);
  useEffect(() => {
    if (!session) {
      setSeconds(duration * 60);
      return;
    }
    const update = () => setSeconds(remainingFocusSeconds(session));
    update();
    const interval = setInterval(update, 500);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [session, duration]);
  const save = useCallback(async () => {
    if (!session || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    const elapsed = session.totalSeconds - remainingFocusSeconds(session);
    const paused = pauseFocus(session);
    setSession(paused);
    try {
      if (elapsed >= 60) {
        // Stable UUID makes retry/reload and simultaneous completion idempotent.
        const result = await supabase.from("focus_sessions").upsert(
          {
            id: session.id,
            user_id: user!.id,
            title: session.title,
            duration: Math.floor(elapsed / 60),
            started_at: new Date(session.startedAt).toISOString(),
            completed_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
        if (result.error) throw result.error;
        await Promise.all([
          client.invalidateQueries({ queryKey: ["focus-stats", user!.id] }),
          client.invalidateQueries({ queryKey: ["overview", user!.id] }),
        ]);
        toast.success("Session enregistrée. Prenez un moment pour souffler.");
      } else
        toast("Session arrêtée avant une minute : aucune statistique ajoutée.");
      try {
        const persisted = readFocusSession(
          localStorage.getItem(key),
          session.userId,
        );
        // This also runs after unmount; never erase a newer session from another tab.
        if (persisted?.id === session.id) localStorage.removeItem(key);
      } catch {
        // Database success remains authoritative when storage is unavailable.
      }
      setSession(null);
    } catch {
      setError(
        "La session n’a pas pu être enregistrée. Elle est conservée sur cet appareil : réessayez quand la connexion revient.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }, [session, user, client, key]);
  useEffect(() => {
    if (session?.deadline !== null && session && seconds === 0 && !error)
      void save();
  }, [session, seconds, save, error]);
  const start = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = String(
      new FormData(event.currentTarget).get("title") || "",
    ).trim();
    if (!title) return;
    const now = Date.now();
    setError("");
    setSession({
      id: crypto.randomUUID(),
      userId: user!.id,
      title,
      totalSeconds: duration * 60,
      remainingSeconds: duration * 60,
      deadline: now + duration * 60_000,
      startedAt: now,
    });
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="eyebrow mb-3">UNE CHOSE À LA FOIS</p>
        <h1 className="page-title">
          Entrez dans le flow<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un moment de calme pour avancer sur ce qui compte.
        </p>
      </div>
      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b px-6 py-4 text-xs text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${session?.deadline ? "bg-emerald-500" : "bg-primary/50"}`}
          />
          {session
            ? session.deadline
              ? "Concentration en cours"
              : "En pause"
            : "Votre prochaine session"}
        </div>
        <div className="p-6 text-center md:p-12">
          <Timer
            className="mx-auto mb-5 text-primary/70"
            size={25}
            strokeWidth={1.3}
          />
          {session && (
            <h2 className="mx-auto max-w-sm break-words text-sm font-medium">
              {session.title}
            </h2>
          )}
          <div
            role="timer"
            aria-label={`${Math.floor(seconds / 60)} minutes et ${seconds % 60} secondes`}
            className="my-8 text-[76px] font-light leading-none tracking-[-4px] tabular-nums sm:text-[106px]"
          >
            {String(Math.floor(seconds / 60)).padStart(2, "0")}
            <span className="text-muted-foreground/40">:</span>
            {String(seconds % 60).padStart(2, "0")}
          </div>
          {session ? (
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                disabled={busy || seconds === 0}
                onClick={() => {
                  setError("");
                  setSession(
                    session.deadline
                      ? pauseFocus(session)
                      : resumeFocus(session),
                  );
                }}
                className="gap-2"
              >
                {session.deadline ? (
                  <>
                    <Pause size={16} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Reprendre
                  </>
                )}
              </Button>
              <Button
                disabled={busy}
                onClick={() => void save()}
                className="gap-2"
              >
                <Check size={16} />
                {busy
                  ? "Enregistrement…"
                  : error
                    ? "Réessayer l’enregistrement"
                    : "Terminer et enregistrer"}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={start}
              className="mx-auto max-w-sm space-y-5 text-left"
            >
              <div className="space-y-2">
                <Label htmlFor="focus-title">
                  Sur quoi allez-vous avancer ?
                </Label>
                <Input
                  id="focus-title"
                  name="title"
                  placeholder="Relire mon cours de statistiques…"
                  maxLength={200}
                  required
                />
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Durée de la session"
              >
                {[15, 25, 45, 60, 90].map((value) => (
                  <Button
                    type="button"
                    size="sm"
                    key={value}
                    variant={duration === value ? "secondary" : "ghost"}
                    aria-pressed={duration === value}
                    onClick={() => setDuration(value)}
                  >
                    {value} min
                  </Button>
                ))}
              </div>
              <Button type="submit" className="w-full gap-2">
                <Play size={16} />
                Commencer ma session
              </Button>
            </form>
          )}
          {error && (
            <p
              role="alert"
              className="mx-auto mt-6 max-w-sm text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <p className="mt-8 text-xs text-muted-foreground">
            Le minuteur se recale après la veille. Aucune notification en
            arrière-plan n’est garantie.
          </p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4">
        <div className="panel p-5">
          <p className="text-xs text-muted-foreground">Sessions sur 7 jours</p>
          <p className="mt-3 text-2xl font-semibold">
            {stats.isError ? "—" : (stats.data?.count ?? "…")}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-xs text-muted-foreground">
            Minutes de concentration
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {stats.isError ? "—" : (stats.data?.minutes ?? "…")}
          </p>
        </div>
      </div>
      {stats.isError && (
        <p role="alert" className="text-sm text-destructive">
          Les statistiques n’ont pas pu être chargées.
        </p>
      )}
    </div>
  );
}
