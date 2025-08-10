
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
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200", 
  low: "text-green-600 bg-green-50 border-green-200"
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
              <AlertTriangle className="h-4 w-4 text-red-500" />
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
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{insight.title}</h5>
                        {insight.metric && (
                          <Badge variant="outline" className="text-xs">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm opacity-90">{insight.insight}</p>
                      <div className="bg-white/60 p-2 rounded text-xs">
                        <strong>Action:</strong> {insight.recommendation}
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
                <CheckCircle className="h-4 w-4 text-green-500" />
                Autres Insights
              </h4>
            )}
            {otherInsights.slice(0, 3).map((insight) => {
              const IconComponent = categoryIcons[insight.category] || Target;
              return (
                <div
                  key={insight.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-4 w-4 mt-1 flex-shrink-0 text-gray-600" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{insight.title}</h5>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            insight.priority === 'medium' ? 'border-yellow-300 text-yellow-700' : 
                            'border-green-300 text-green-700'
                          }`}
                        >
                          {insight.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{insight.insight}</p>
                      <p className="text-xs text-gray-500">
                        <strong>💡 </strong>{insight.recommendation}
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
