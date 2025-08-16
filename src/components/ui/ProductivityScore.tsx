
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Zap } from "lucide-react";
import { useRealtimeProductivityScore } from "@/hooks/useRealtimeProductivityScore";
import { motion } from "framer-motion";

export function ProductivityScore() {
  const { data: productivityData, isLoading } = useRealtimeProductivityScore();

  // Default values if data is not available
  const {
    score = 0,
    level = 'Débutant',
    badges = [],
    completionRate = 0,
    focusTimeScore = 0,
    consistencyScore = 0,
    streakBonus = 0
  } = productivityData || {};

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Expert': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'Avancé': return <Star className="h-5 w-5 text-blue-500" />;
      case 'Intermédiaire': return <Target className="h-5 w-5 text-green-500" />;
      default: return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-500" />
            Score de Productivité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getLevelIcon(level)}
          Score de Productivité
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score principal */}
        <div className="text-center">
          <motion.div 
            className={`text-4xl font-bold ${getScoreColor(score)}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            key={score} // Re-animer quand le score change
          >
            {score}/100
          </motion.div>
          <div className="text-sm text-muted-foreground">Niveau: {level}</div>
          <Progress value={score} className="mt-2" />
        </div>

        {/* Détails des scores */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium">Tâches</div>
            <div className="text-muted-foreground">{completionRate.toFixed(0)}%</div>
          </div>
          <div>
            <div className="font-medium">Focus</div>
            <div className="text-muted-foreground">{focusTimeScore.toFixed(0)}/25</div>
          </div>
          <div>
            <div className="font-medium">Consistance</div>
            <div className="text-muted-foreground">{consistencyScore.toFixed(0)}/25</div>
          </div>
          <div>
            <div className="font-medium">Bonus Série</div>
            <div className="text-muted-foreground">{streakBonus.toFixed(0)}/20</div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <div className="font-medium text-sm mb-2">Badges obtenus :</div>
            <div className="flex flex-wrap gap-1">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
