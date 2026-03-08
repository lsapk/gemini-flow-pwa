import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, Clock, Compass, Swords, Shield, Crown } from "lucide-react";
import { usePenguinExpeditions, Expedition } from "@/hooks/usePenguinExpeditions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const REWARD_ICONS: Record<string, string> = {
  shrimp: '🦐',
  salmon: '🐟',
  golden_fish: '✨🐠',
};

// Rarity system based on reward amount
const getRarity = (reward_amount: number) => {
  if (reward_amount >= 10) return { label: "Légendaire", color: "text-amber-400 bg-amber-500/15 border-amber-500/25", icon: Crown, dot: "🟡" };
  if (reward_amount >= 5) return { label: "Épique", color: "text-purple-400 bg-purple-500/15 border-purple-500/25", icon: Shield, dot: "🟣" };
  if (reward_amount >= 3) return { label: "Rare", color: "text-sky-400 bg-sky-500/15 border-sky-500/25", icon: Swords, dot: "🔵" };
  return { label: "Commune", color: "text-muted-foreground bg-muted/30 border-border/20", icon: Compass, dot: "⚪" };
};

const ExpeditionCard = ({ exp, index }: { exp: Expedition; index: number }) => {
  const progress = Math.min((exp.current_progress / exp.target_value) * 100, 100);
  const rarity = getRarity(exp.reward_amount);
  const RarityIcon = rarity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`min-w-[260px] p-4 rounded-2xl border backdrop-blur-sm transition-colors relative overflow-hidden ${
        exp.completed
          ? 'bg-success/10 border-success/20'
          : 'bg-card/60 border-border/20 hover:border-border/40'
      }`}
    >
      {/* Rarity indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`text-[9px] gap-1 ${rarity.color}`}>
          <RarityIcon className="w-3 h-3" />
          {rarity.label}
        </Badge>
        <Badge className="ml-auto flex-shrink-0 text-[10px] bg-primary/10 border-primary/20 text-primary">
          {REWARD_ICONS[exp.reward_type]} ×{exp.reward_amount}
        </Badge>
      </div>

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
            {exp.completed ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> : <span>⚔️</span>}
            <span className="truncate">{exp.title}</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{exp.description}</p>
        </div>
      </div>

      {/* Progress bar with shimmer */}
      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {!exp.completed && (
            <motion.div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
              animate={{ left: ["-15%", "115%"] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{exp.current_progress}/{exp.target_value}</span>
      </div>

      {/* Timer */}
      {exp.expires_at && !exp.completed && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(exp.expires_at), { addSuffix: true, locale: fr })}
        </div>
      )}

      {/* Completed sparkle overlay */}
      {exp.completed && (
        <motion.div
          className="absolute top-2 right-2"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-lg">✨</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export const ExpeditionBoard = () => {
  const { activeExpeditions, completedExpeditions, generateExpeditions, isGenerating } = usePenguinExpeditions();

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg text-foreground">
            <Compass className="w-5 h-5 text-sky-400" />
            Quêtes Actives
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateExpeditions()}
            disabled={isGenerating || activeExpeditions.length >= 3}
            className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
            Nouvelles
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeExpeditions.length === 0 && completedExpeditions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <span className="text-5xl block mb-3">⚔️</span>
            <p className="text-sm font-medium">Aucune quête en cours</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Générez des quêtes pour gagner des récompenses</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden -mx-1 px-1">
            {activeExpeditions.map((exp, i) => (
              <ExpeditionCard key={exp.id} exp={exp} index={i} />
            ))}
          </div>
        )}

        {completedExpeditions.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border/20">
            <h4 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complétées récemment
            </h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden -mx-1 px-1">
              {completedExpeditions.slice(0, 3).map((exp, i) => (
                <ExpeditionCard key={exp.id} exp={exp} index={i} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
