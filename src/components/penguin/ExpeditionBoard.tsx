import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { usePenguinExpeditions, Expedition } from "@/hooks/usePenguinExpeditions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const REWARD_ICONS: Record<string, string> = {
  shrimp: '🦐',
  salmon: '🐟',
  golden_fish: '✨🐠',
};

const ExpeditionCard = ({ exp }: { exp: Expedition }) => {
  const progress = Math.min((exp.current_progress / exp.target_value) * 100, 100);
  const isClose = progress >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border transition-all ${
        exp.completed
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/30'
          : isClose
          ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-300/50 dark:border-sky-700/50'
          : 'bg-card border-border/30'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2">
            {exp.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : '🧊'}
            {exp.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{exp.description}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-sky-100/50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
          {REWARD_ICONS[exp.reward_type]} ×{exp.reward_amount}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground font-mono">{exp.current_progress}/{exp.target_value}</span>
      </div>

      {exp.expires_at && !exp.completed && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(exp.expires_at), { addSuffix: true, locale: fr })}
        </div>
      )}
    </motion.div>
  );
};

export const ExpeditionBoard = () => {
  const { activeExpeditions, completedExpeditions, generateExpeditions, isGenerating } = usePenguinExpeditions();

  return (
    <Card className="border-sky-200/20 dark:border-sky-800/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">🧊 Expéditions</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateExpeditions()}
            disabled={isGenerating || activeExpeditions.length >= 3}
            className="border-sky-300 dark:border-sky-700"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Nouvelles
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeExpeditions.length === 0 && completedExpeditions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <span className="text-4xl block mb-3">🧊</span>
            <p className="text-sm">Aucune expédition en cours</p>
            <p className="text-xs mt-1">Générez des expéditions pour gagner des récompenses</p>
          </div>
        )}

        {activeExpeditions.map(exp => (
          <ExpeditionCard key={exp.id} exp={exp} />
        ))}

        {completedExpeditions.length > 0 && (
          <div className="pt-2 border-t border-border/30">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Complétées récemment</h4>
            {completedExpeditions.slice(0, 3).map(exp => (
              <ExpeditionCard key={exp.id} exp={exp} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
