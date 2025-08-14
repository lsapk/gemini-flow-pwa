
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useRealisticProductivityScore } from "@/hooks/useRealisticProductivityScore";

export default function ProductivityScore() {
  const { score, isLoading, error } = useRealisticProductivityScore();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score de Productivité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score de Productivité</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            {error || "Données indisponibles"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Bon";
    if (value >= 40) return "Moyen";
    return "À améliorer";
  };

  const getTrendIcon = () => {
    const trend = score.weeklyTrend;
    if (trend.length < 2) return <Minus className="w-4 h-4" />;
    
    const lastTwo = trend.slice(-2);
    if (lastTwo[1] > lastTwo[0]) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (lastTwo[1] < lastTwo[0]) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Score de Productivité
          {getTrendIcon()}
        </CardTitle>
        <CardDescription>
          Basé sur vos tâches, habitudes et bien-être
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Global */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}%
          </div>
          <Badge variant="secondary" className="mt-2">
            {getScoreLabel(score.overall)}
          </Badge>
        </div>

        {/* Métriques Détaillées */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Métriques Détaillées</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Complétion des tâches</span>
                <span>{score.metrics.taskCompletion}%</span>
              </div>
              <Progress value={score.metrics.taskCompletion} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Constance des habitudes</span>
                <span>{score.metrics.habitConsistency}%</span>
              </div>
              <Progress value={score.metrics.habitConsistency} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Qualité du focus</span>
                <span>{score.metrics.focusQuality}%</span>
              </div>
              <Progress value={score.metrics.focusQuality} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progression des objectifs</span>
                <span>{score.metrics.goalProgress}%</span>
              </div>
              <Progress value={score.metrics.goalProgress} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Bien-être mental</span>
                <span>{score.metrics.mentalWellbeing}%</span>
              </div>
              <Progress value={score.metrics.mentalWellbeing} className="h-2" />
            </div>
          </div>
        </div>

        {/* Insights */}
        {score.insights && score.insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Insights</h4>
            {score.insights.slice(0, 2).map((insight, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                {insight.type === 'info' && <Info className="w-4 h-4 text-blue-600 mt-0.5" />}
                <div className="text-sm">
                  <p className="font-medium">{insight.message}</p>
                  {insight.recommendation && (
                    <p className="text-muted-foreground mt-1">{insight.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Dernière mise à jour: {score.lastUpdated.toLocaleString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  );
}
