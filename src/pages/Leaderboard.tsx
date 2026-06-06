import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy, Medal, Crown, Flame, Target, BookOpen, Brain, CheckSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "all";

interface LeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  score: number;
  tasks_done: number;
  habits_done: number;
  focus_minutes: number;
  journal_count: number;
  reflection_count: number;
  goals_done: number;
  is_me: boolean;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "all", label: "Tout le temps" },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [optIn, setOptIn] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_period: period,
      p_limit: 100,
    });
    if (error) {
      toast.error("Impossible de charger le classement");
      console.error(error);
    } else {
      setRows((data as LeaderboardRow[]) || []);
    }
    setLoading(false);
  };

  const loadOptIn = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_profiles")
      .select("leaderboard_opt_in")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setOptIn((data as { leaderboard_opt_in?: boolean }).leaderboard_opt_in !== false);
  };

  useEffect(() => {
    load();
  }, [period]);

  useEffect(() => {
    loadOptIn();
  }, [user?.id]);

  const toggleOptIn = async (value: boolean) => {
    if (!user) return;
    setOptIn(value);
    const { error } = await supabase
      .from("user_profiles")
      .update({ leaderboard_opt_in: value })
      .eq("id", user.id);
    if (error) {
      toast.error("Échec de la mise à jour");
      setOptIn(!value);
    } else {
      toast.success(value ? "Vous apparaissez dans le classement" : "Vous êtes masqué du classement");
      load();
    }
  };

  const me = rows.find((r) => r.is_me);
  const top3 = rows.slice(0, 3);
  const rest = rows.filter((r) => r.rank > 3 && !r.is_me).slice(0, 50);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-zinc-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20">
          <Trophy className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold gradient-text">Classement</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Productivité globale calculée à partir du nombre d'actions — jamais du contenu.
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 p-1 rounded-2xl bg-muted/30 border border-border/30 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-4 h-9 rounded-xl text-sm font-medium transition-all",
              period === p.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Rewards info */}
      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
        <CardContent className="p-4 flex items-center gap-3 text-sm">
          <Sparkles className="h-5 w-5 text-yellow-400 shrink-0" />
          <span>
            <strong className="text-foreground">Top 3 récompensés :</strong>{" "}
            <span className="text-muted-foreground">
              🥇 +100 crédits IA · 🥈 +50 crédits IA · 🥉 +25 crédits IA (chaque mois, attribués manuellement par l'équipe).
            </span>
          </span>
        </CardContent>
      </Card>

      {/* Top 3 podium */}
      {top3.length >= 1 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const r = top3[idx];
            if (!r) return <div key={idx} />;
            const heights = ["h-32", "h-40", "h-28"];
            const colors = [
              "from-zinc-300/20 to-zinc-300/5 border-zinc-300/30",
              "from-yellow-400/20 to-yellow-400/5 border-yellow-400/40",
              "from-amber-600/20 to-amber-600/5 border-amber-600/30",
            ];
            return (
              <Card
                key={r.user_id}
                className={cn(
                  "border bg-gradient-to-b text-center",
                  colors[r.rank - 1],
                  r.is_me && "ring-2 ring-primary"
                )}
              >
                <CardContent className={cn("flex flex-col items-center justify-end pt-4 pb-3", heights[r.rank - 1])}>
                  <Avatar className="h-12 w-12 mb-2 border-2 border-white/10">
                    <AvatarImage src={r.photo_url || undefined} />
                    <AvatarFallback>{(r.display_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-semibold truncate max-w-full px-2">{r.display_name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {rankIcon(r.rank)}
                    <span className="text-lg font-bold">{r.score.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* My position */}
      {me && me.rank > 3 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" /> Ma position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderRow row={me} />
          </CardContent>
        </Card>
      )}

      {/* Rest of leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classement général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && rest.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun autre utilisateur dans le classement pour cette période.</p>
          )}
          {rest.map((r) => (
            <LeaderRow key={r.user_id} row={r} />
          ))}
        </CardContent>
      </Card>

      {/* Privacy opt-in */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="lb-optin" className="font-medium">Apparaître dans le classement</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Seuls votre nom et vos compteurs (jamais le contenu) sont partagés.
            </p>
          </div>
          <Switch id="lb-optin" checked={optIn} onCheckedChange={toggleOptIn} />
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderRow({ row }: { row: LeaderboardRow }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border",
        row.is_me ? "border-primary/40 bg-primary/5" : "border-border/30 bg-muted/20"
      )}
    >
      <div className="w-8 flex items-center justify-center">
        {row.rank <= 3 ? (
          row.rank === 1 ? <Crown className="h-4 w-4 text-yellow-400" /> :
          row.rank === 2 ? <Medal className="h-4 w-4 text-zinc-300" /> :
          <Medal className="h-4 w-4 text-amber-600" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{row.rank}</span>
        )}
      </div>
      <Avatar className="h-9 w-9">
        <AvatarImage src={row.photo_url || undefined} />
        <AvatarFallback>{(row.display_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {row.display_name}
          {row.is_me && <Badge variant="secondary" className="ml-2 text-[10px]">Vous</Badge>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{row.tasks_done}</span>
          <span className="flex items-center gap-1"><Flame className="h-3 w-3" />{row.habits_done}</span>
          <span className="flex items-center gap-1"><Brain className="h-3 w-3" />{row.focus_minutes}min</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{row.journal_count + row.reflection_count}</span>
          <span className="flex items-center gap-1"><Target className="h-3 w-3" />{row.goals_done}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-bold">{row.score.toLocaleString()}</div>
        <div className="text-[10px] text-muted-foreground">pts</div>
      </div>
    </div>
  );
}
