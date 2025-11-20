
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAIProductivityInsights } from "@/hooks/useAIProductivityInsights";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Loader2
} from "lucide-react";

const priorityColors = {
  high: "border-destructive/20 bg-destructive/5",
  medium: "border-warning/20 bg-warning/5", 
  low: "border-success/20 bg-success/5"
};

const priorityTextColors = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-success"
};

const categoryIcons = {
  performance: TrendingUp,
  habits: Target,
  focus: Brain,
  motivation: Zap,
  optimization: CheckCircle
};

export function SmartInsightsWidget() {
  const { insights, isLoading } = useAIProductivityInsights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            <span className="ml-2 text-sm sm:text-base">Analyse en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Brain className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base">Utilisez l'app davantage pour recevoir des insights personnalisés !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const otherInsights = insights.filter(insight => insight.priority !== 'high');

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            <span className="text-base sm:text-lg">Insights IA ({insights.length})</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs sm:text-sm">
            Personnalisé
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Insights prioritaires */}
        {highPriorityInsights.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              Priorité Haute
            </h4>
            {highPriorityInsights.slice(0, 2).map((insight) => {
              const IconComponent = categoryIcons[insight.category] || Target;
              return (
                <div
                  key={insight.id}
                  className={`p-3 sm:p-4 rounded-lg border ${priorityColors[insight.priority]}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${priorityTextColors[insight.priority]}`} />
                    <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h5 className={`font-medium text-xs sm:text-sm ${priorityTextColors[insight.priority]}`}>{insight.title}</h5>
                        {insight.metric && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/80">{insight.insight}</p>
                      <div className="flex items-start gap-1.5 sm:gap-2 pt-1">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Autres insights */}
        {otherInsights.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            {highPriorityInsights.length > 0 && (
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2 pt-2">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                Autres recommandations
              </h4>
            )}
            {otherInsights.slice(0, 3).map((insight) => {
              const IconComponent = categoryIcons[insight.category] || Target;
              return (
                <div
                  key={insight.id}
                  className={`p-3 sm:p-4 rounded-lg border ${priorityColors[insight.priority]}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${priorityTextColors[insight.priority]}`} />
                    <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h5 className={`font-medium text-xs sm:text-sm ${priorityTextColors[insight.priority]}`}>{insight.title}</h5>
                        {insight.metric && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/80">{insight.insight}</p>
                      <div className="flex items-start gap-1.5 sm:gap-2 pt-1">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Button pour voir tous les insights */}
        {insights.length > 5 && (
          <Button 
            variant="outline" 
            className="w-full mt-2 sm:mt-4 text-xs sm:text-sm"
            onClick={() => {
              // À implémenter: naviguer vers une page dédiée aux insights
              console.log("Voir tous les insights");
            }}
          >
            Voir tous les insights ({insights.length})
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
