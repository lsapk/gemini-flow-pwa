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

const ExpeditionCard = ({ exp, index }: { exp: Expedition; index: number }) => {
  const progress = Math.min((exp.current_progress / exp.target_value) * 100, 100);
  const isClose = progress >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`min-w-[280px] p-4 rounded-2xl border backdrop-blur-xl transition-all ${
        exp.completed
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : isClose
          ? 'bg-sky-500/10 border-sky-500/20'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 text-white/90">
            {exp.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : '🧊'}
            {exp.title}
          </h4>
          <p className="text-xs text-white/50 mt-0.5 max-w-[200px]">{exp.description}</p>
        </div>
        <Badge className="text-[10px] bg-sky-500/20 border-sky-500/30 text-sky-300">
          {REWARD_ICONS[exp.reward_type]} ×{exp.reward_amount}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Progress value={progress} className="h-2 flex-1 bg-white/10" />
        <span className="text-xs text-white/50 font-mono">{exp.current_progress}/{exp.target_value}</span>
      </div>

      {exp.expires_at && !exp.completed && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-white/40">
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
    <Card className="bg-[#1A1F26]/80 backdrop-blur-xl border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg text-white/90">🧊 Expéditions</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateExpeditions()}
            disabled={isGenerating || activeExpeditions.length >= 3}
            className="bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Nouvelles
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeExpeditions.length === 0 && completedExpeditions.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <span className="text-4xl block mb-3">🧊</span>
            <p className="text-sm">Aucune expédition en cours</p>
            <p className="text-xs mt-1 text-white/30">Générez des expéditions pour gagner des récompenses</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden">
            {activeExpeditions.map((exp, i) => (
              <ExpeditionCard key={exp.id} exp={exp} index={i} />
            ))}
          </div>
        )}

        {completedExpeditions.length > 0 && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <h4 className="text-xs font-medium text-white/40 mb-3">Complétées récemment</h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden">
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
