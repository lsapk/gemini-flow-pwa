import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, Clock, Compass } from "lucide-react";
import { usePenguinExpeditions, Expedition } from "@/hooks/usePenguinExpeditions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const REWARD_ICONS: Record<string, string> = {
  shrimp: '🦐',
  salmon: '🐟',
  golden_fish: '✨🐠',
};

const ExpeditionCard = ({ exp, index }: { exp: Expedition; index: number }) => {
  const progress = Math.min((exp.current_progress / exp.target_value) * 100, 100);
  const isClose = progress >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`min-w-[260px] p-4 rounded-2xl border backdrop-blur-sm transition-colors ${
        exp.completed
          ? 'bg-success/10 border-success/20'
          : isClose
          ? 'bg-primary/10 border-primary/20'
          : 'bg-card/60 border-border/20 hover:border-border/40'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
            {exp.completed ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> : <span>🧊</span>}
            <span className="truncate">{exp.title}</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{exp.description}</p>
        </div>
        <Badge className="ml-2 flex-shrink-0 text-[10px] bg-primary/10 border-primary/20 text-primary">
          {REWARD_ICONS[exp.reward_type]} ×{exp.reward_amount}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Progress value={progress} className="h-2 flex-1 bg-muted" />
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
    <Card className="bg-card/80 backdrop-blur-xl border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg text-foreground">
            <Compass className="w-5 h-5 text-sky-400" />
            Expéditions
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
            <span className="text-5xl block mb-3">🧊</span>
            <p className="text-sm font-medium">Aucune expédition en cours</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Générez des expéditions pour gagner des récompenses</p>
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
