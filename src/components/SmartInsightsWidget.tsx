import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAIProductivityInsights } from "@/hooks/useAIProductivityInsights";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  CheckCircle, 
  Loader2,
  ArrowRight
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
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
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Conseils IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Conseils IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Utilisez l'app pour recevoir des conseils
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show only top 3 insights, simplified
  const topInsights = insights.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Conseils IA
          </div>
          <Badge variant="secondary" className="text-xs">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topInsights.map((insight) => {
          const IconComponent = categoryIcons[insight.category || 'focus'] || Brain;
          const priorityColor = insight.priority === 'high' 
            ? 'text-destructive' 
            : insight.priority === 'medium' 
              ? 'text-warning' 
              : 'text-success';
          
          return (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <IconComponent className={`h-4 w-4 mt-0.5 ${priorityColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  {insight.recommendation.length > 60 
                    ? insight.recommendation.slice(0, 60) + '...' 
                    : insight.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
