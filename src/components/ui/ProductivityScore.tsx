
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { useRealisticProductivityScore } from "@/hooks/useRealisticProductivityScore";
import { motion } from "framer-motion";

export function ProductivityScore() {
  const { data: productivityData, isLoading } = useRealisticProductivityScore();

  // Default values if data is not available
  const {
    score = 0,
    level = 'Débutant',
    badges = [],
    taskEfficiency = 0,
    habitConsistency = 0,
    focusQuality = 0,
    goalProgress = 0,
    mentalWellbeing = 0,
    weeklyTrend = 0,
    strengths = [],
    improvementAreas = [],
    nextMilestone = "Utilisez l'app régulièrement"
  } = productivityData || {};

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Maître': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'Expert': return <Star className="h-5 w-5 text-purple-500" />;
      case 'Avancé': return <Target className="h-5 w-5 text-blue-500" />;
      case 'Intermédiaire': return <Zap className="h-5 w-5 text-green-500" />;
      default: return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-500" />
            Score de Productivité Réaliste
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
          Score de Productivité Réaliste
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
            key={score}
          >
            {score}/100
          </motion.div>
          <div className="text-sm text-muted-foreground mb-2">Niveau: {level}</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            {getTrendIcon(weeklyTrend)}
            <span className="text-sm">
              {weeklyTrend > 0 ? `+${weeklyTrend}` : weeklyTrend < 0 ? `${weeklyTrend}` : '0'} cette semaine
            </span>
          </div>
          <Progress value={score} className="mt-2" />
        </div>

        {/* Scores détaillés */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium">Efficacité Tâches</div>
            <div className="text-muted-foreground">{taskEfficiency.toFixed(0)}%</div>
          </div>
          <div>
            <div className="font-medium">Consistance</div>
            <div className="text-muted-foreground">{habitConsistency.toFixed(0)}%</div>
          </div>
          <div>
            <div className="font-medium">Qualité Focus</div>
            <div className="text-muted-foreground">{focusQuality.toFixed(0)}%</div>
          </div>
          <div>
            <div className="font-medium">Bien-être</div>
            <div className="text-muted-foreground">{mentalWellbeing.toFixed(0)}%</div>
          </div>
        </div>

        {/* Forces et axes d'amélioration */}
        {(strengths.length > 0 || improvementAreas.length > 0) && (
          <div className="space-y-2">
            {strengths.length > 0 && (
              <div>
                <div className="font-medium text-sm mb-1 text-green-600">Forces :</div>
                <div className="flex flex-wrap gap-1">
                  {strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-200 text-green-700">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {improvementAreas.length > 0 && (
              <div>
                <div className="font-medium text-sm mb-1 text-orange-600">À améliorer :</div>
                <div className="flex flex-wrap gap-1">
                  {improvementAreas.map((area, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Prochain objectif */}
        {nextMilestone && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-sm mb-1">Prochain objectif :</div>
            <div className="text-sm text-muted-foreground">{nextMilestone}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
