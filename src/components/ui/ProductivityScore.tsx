
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
    components = {
      taskEfficiency: 0,
      habitConsistency: 0,
      focusQuality: 0,
      goalProgress: 0,
      wellBeing: 0
    },
    weeklyTrend = 0
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
      default: return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 10) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < -10) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />; // Stable
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
        {/* Score principal avec tendance */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div 
              className={`text-4xl font-bold ${getScoreColor(score)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              key={score}
            >
              {score}%
            </motion.div>
            {getTrendIcon(weeklyTrend)}
          </div>
          <div className="text-sm text-muted-foreground">
            Niveau: {level}
            {weeklyTrend !== 0 && (
              <span className={`ml-2 ${weeklyTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({weeklyTrend > 0 ? '+' : ''}{weeklyTrend.toFixed(0)}% cette semaine)
              </span>
            )}
          </div>
          <Progress value={score} className="mt-2" />
        </div>

        {/* Analyse détaillée des composants */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Analyse détaillée :</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Efficacité des Tâches</span>
              <span className="font-bold">{components.taskEfficiency.toFixed(0)}%</span>
            </div>
            <Progress value={components.taskEfficiency} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Consistance Habitudes</span>
              <span className="font-bold">{components.habitConsistency.toFixed(0)}%</span>
            </div>
            <Progress value={components.habitConsistency} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Qualité du Focus</span>
              <span className="font-bold">{components.focusQuality.toFixed(0)}%</span>
            </div>
            <Progress value={components.focusQuality} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Progrès Objectifs</span>
              <span className="font-bold">{components.goalProgress.toFixed(0)}%</span>
            </div>
            <Progress value={components.goalProgress} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Bien-être Mental</span>
              <span className="font-bold">{components.wellBeing.toFixed(0)}%</span>
            </div>
            <Progress value={components.wellBeing} className="h-1" />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <div className="font-medium text-sm mb-2">Accomplissements :</div>
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
