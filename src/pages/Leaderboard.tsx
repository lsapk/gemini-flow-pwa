import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy, Medal, Crown, Flame, Target, BookOpen, Brain, CheckSquare, Sparkles, TrendingUp, Star, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header - Apple Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Classement</h1>
          </div>
          <p className="text-muted-foreground max-w-md">
            Célébrez la productivité. Les points sont basés sur vos actions réelles, analysées avec intégrité.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl w-fit self-start md:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-5 h-10 rounded-xl text-sm font-bold transition-all duration-300",
                period === p.value
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards info - Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-none bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xl overflow-hidden rounded-[2rem]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] -z-10 rounded-full" />
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
              <Sparkles className="h-6 w-6 text-amber-400" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-white mb-1">Récompenses Mensuelles</h3>
              <p className="text-sm text-white/60">
                <span className="text-amber-400 font-bold">🥇 100</span> · <span className="text-zinc-300 font-bold">🥈 50</span> · <span className="text-amber-700 font-bold">🥉 25</span> crédits IA offerts chaque mois.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 3 podium - Enhanced Fluid Design */}
      {top3.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[1, 0, 2].map((idx) => {
            const r = top3[idx];
            if (!r) return <div key={idx} className="hidden md:block" />;

            const isFirst = r.rank === 1;
            const isSecond = r.rank === 2;
            const isThird = r.rank === 3;

            return (
              <motion.div
                key={r.user_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "relative group",
                  isFirst ? "md:-mt-4 md:z-10" : "md:mt-4"
                )}
              >
                <Card
                  className={cn(
                    "border-none overflow-hidden rounded-[2.5rem] text-center h-full transition-all duration-500 group-hover:translate-y-[-8px]",
                    isFirst ? "bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 shadow-[0_20px_50px_rgba(234,179,8,0.15)]" :
                    isSecond ? "bg-gradient-to-b from-zinc-400/10 to-zinc-400/5" :
                    "bg-gradient-to-b from-amber-700/10 to-amber-700/5",
                    r.is_me && "ring-2 ring-primary ring-offset-4 ring-offset-background"
                  )}
                >
                  <CardContent className="flex flex-col items-center pt-8 pb-6">
                    <div className="relative mb-6">
                      <div className={cn(
                        "absolute -inset-2 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity",
                        isFirst ? "bg-yellow-500" : isSecond ? "bg-zinc-400" : "bg-amber-700"
                      )} />
                      <Avatar className={cn(
                        "h-24 w-24 border-4 relative z-10",
                        isFirst ? "border-yellow-500/50" : isSecond ? "border-zinc-400/30" : "border-amber-700/30"
                      )}>
                        <AvatarImage src={r.photo_url || undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                          {(() => {
                            if (!r.display_name) return "?";
                            const parts = r.display_name.trim().split(/\s+/);
                            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                            return r.display_name.charAt(0).toUpperCase();
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
                        {isFirst ? (
                          <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black shadow-lg">#1</div>
                        ) : isSecond ? (
                          <div className="bg-zinc-400 text-black px-3 py-1 rounded-full text-xs font-black shadow-lg">#2</div>
                        ) : (
                          <div className="bg-amber-700 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">#3</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mb-6 px-4 w-full">
                      <div className="text-lg font-bold truncate text-white">{r.display_name}</div>
                      {r.is_me && <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 rounded-lg text-[10px] uppercase tracking-widest font-black">Vous</Badge>}
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-black tracking-tighter text-white mb-1">
                        {r.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">POINTS</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My position floating card */}
      {me && me.rank > 3 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sticky bottom-6 z-20"
        >
          <Card className="border-primary/40 bg-primary/10 backdrop-blur-2xl shadow-2xl shadow-primary/20 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                    #{me.rank}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Votre Position</div>
                    <div className="text-xs text-white/50">Vous progressez bien !</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-white">{me.score.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-tighter">POINTS TOTAL</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Top Performance
          </h2>
          <span className="text-xs text-muted-foreground">{rest.length + top3.length} participants</span>
        </div>

        <Card className="border-none bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-2 space-y-1">
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary/50" />
                <p className="text-sm text-muted-foreground animate-pulse">Synchronisation des scores...</p>
              </div>
            )}

            {!loading && rest.length === 0 && top3.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">Aucun utilisateur dans le classement pour cette période.</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {rest.map((r, index) => (
                <motion.div
                  key={r.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <LeaderRow row={r} />
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

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
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group",
        row.is_me
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-white/5 border border-transparent"
      )}
    >
      <div className="w-10 h-10 flex items-center justify-center font-black text-lg text-white/20 group-hover:text-primary/50 transition-colors">
        {row.rank}
      </div>

      <Avatar className="h-12 w-12 border-2 border-white/5 shadow-lg group-hover:scale-105 transition-transform">
        <AvatarImage src={row.photo_url || undefined} className="object-cover" />
        <AvatarFallback className="font-bold bg-muted text-muted-foreground">{getInitials(row.display_name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-base font-bold text-white truncate">
            {row.display_name}
          </div>
          {row.is_me && <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[9px] font-black h-4 uppercase">Vous</Badge>}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
            <CheckSquare className="h-3 w-3 text-emerald-500" />
            <span>{row.tasks_done}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>{row.habits_done}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
            <Brain className="h-3 w-3 text-blue-500" />
            <span>{Math.round(row.focus_minutes / 60)}h</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
            <Target className="h-3 w-3 text-purple-500" />
            <span>{row.goals_done}</span>
          </div>
        </div>
      </div>

      <div className="text-right flex flex-col justify-center">
        <div className="text-xl font-black text-white leading-none">
          {row.score.toLocaleString()}
        </div>
        <div className="text-[9px] font-black text-white/20 uppercase tracking-tighter mt-1">POINTS</div>
      </div>
    </div>
  );
}
