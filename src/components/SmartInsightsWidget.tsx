
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Analyse en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Utilisez l'app davantage pour recevoir des insights personnalisés !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const otherInsights = insights.filter(insight => insight.priority !== 'high');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Insights IA ({insights.length})
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Personnalisé
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights prioritaires */}
        {highPriorityInsights.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Priorité Haute
            </h4>
            {highPriorityInsights.slice(0, 2).map((insight) => {
              const IconComponent = categoryIcons[insight.category] || Target;
              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${priorityColors[insight.priority]}`}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${priorityTextColors[insight.priority]}`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className={`font-medium text-sm ${priorityTextColors[insight.priority]}`}>{insight.title}</h5>
                        {insight.metric && (
                          <Badge variant="outline" className="text-xs">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90">{insight.insight}</p>
                      <div className="bg-muted/60 p-3 rounded-md text-xs border border-border/50">
                        <strong className="text-foreground">Action:</strong> <span className="text-muted-foreground">{insight.recommendation}</span>
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
          <div className="space-y-3">
            {highPriorityInsights.length > 0 && (
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Autres Insights
              </h4>
            )}
            {otherInsights.slice(0, 3).map((insight) => {
              const IconComponent = categoryIcons[insight.category] || Target;
              return (
                <div
                  key={insight.id}
                  className="p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-medium text-sm text-foreground">{insight.title}</h5>
                        <Badge 
                          variant="outline" 
                          className={`text-xs whitespace-nowrap ${
                            insight.priority === 'medium' ? 'border-warning/30 text-warning bg-warning/5' : 
                            'border-success/30 text-success bg-success/5'
                          }`}
                        >
                          {insight.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.insight}</p>
                      <p className="text-xs text-muted-foreground/80 bg-muted/30 p-2 rounded-md">
                        <strong className="text-foreground">💡 </strong>{insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bouton pour voir plus */}
        {insights.length > 5 && (
          <Button variant="outline" size="sm" className="w-full">
            Voir tous les insights ({insights.length})
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
