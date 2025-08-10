
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Brain,
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useEnhancedProductivityScore } from "@/hooks/useEnhancedProductivityScore";
import { motion } from "framer-motion";

export function EnhancedProductivityDashboard() {
  const { data: productivityData, isLoading } = useEnhancedProductivityScore();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    score = 0,
    level = 'Débutant',
    badges = [],
    streakBonus = 0,
    completionRate = 0,
    focusTimeScore = 0,
    consistencyScore = 0,
    qualityScore = 0,
    timeManagementScore = 0,
    journalScore = 0,
    goalScore = 0,
    insights = [],
    recommendations = [],
    weeklyTrend = 0,
    strongPoints = [],
    improvementAreas = [],
    nextMilestone = ""
  } = productivityData || {};

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Expert': case 'Maître': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'Avancé': return <Star className="h-5 w-5 text-blue-500" />;
      case 'Intermédiaire': return <Target className="h-5 w-5 text-green-500" />;
      default: return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Score principal avec tendance */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getLevelIcon(level)}
              <span>Score de Productivité</span>
            </div>
            <div className="flex items-center gap-2">
              {weeklyTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : weeklyTrend < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <span className={`text-sm ${weeklyTrend > 0 ? 'text-green-600' : weeklyTrend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {weeklyTrend > 0 ? '+' : ''}{weeklyTrend}% cette semaine
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-center mb-4">
            <motion.div
              className={`text-5xl font-bold ${getScoreColor(score)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              {score}/100
            </motion.div>
            <div className="text-lg text-muted-foreground mt-1">Niveau: {level}</div>
            <Progress value={score} className="mt-3 h-3" />
          </div>

          {/* Répartition détaillée */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="font-semibold">Tâches</div>
              <div className="text-2xl font-bold text-blue-600">{completionRate.toFixed(0)}%</div>
            </div>
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="font-semibold">Focus</div>
              <div className="text-2xl font-bold text-purple-600">{focusTimeScore.toFixed(0)}/25</div>
            </div>
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="font-semibold">Consistance</div>
              <div className="text-2xl font-bold text-green-600">{consistencyScore.toFixed(0)}/25</div>
            </div>
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="font-semibold">Bonus</div>
              <div className="text-2xl font-bold text-orange-600">{streakBonus.toFixed(0)}/20</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points forts et améliorations */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Points Forts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strongPoints.length > 0 ? (
              <div className="space-y-2">
                {strongPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{point}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Continuez vos efforts pour identifier vos points forts !</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              À Améliorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {improvementAreas.length > 0 ? (
              <div className="space-y-2">
                {improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Excellent ! Aucun point d'amélioration identifié.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights et recommandations */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Analyses Personnalisées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Utilisez l'app davantage pour obtenir des analyses personnalisées.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Continuez à utiliser l'app pour recevoir des recommandations.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prochain objectif */}
      {nextMilestone && (
        <Card className="border-2 border-dashed border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Target className="h-5 w-5" />
              Prochain Objectif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{nextMilestone}</p>
              <Button size="sm" className="ml-4">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Badges Obtenus ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    🏆 {badge}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scores détaillés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Détail des Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Qualité</span>
                <span className="font-semibold">{qualityScore.toFixed(0)}/25</span>
              </div>
              <Progress value={(qualityScore / 25) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Gestion Temps</span>
                <span className="font-semibold">{timeManagementScore.toFixed(0)}/25</span>
              </div>
              <Progress value={(timeManagementScore / 25) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Journal</span>
                <span className="font-semibold">{journalScore.toFixed(0)}/15</span>
              </div>
              <Progress value={(journalScore / 15) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Objectifs</span>
                <span className="font-semibold">{goalScore.toFixed(0)}/15</span>
              </div>
              <Progress value={(goalScore / 15) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
