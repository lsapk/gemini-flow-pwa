import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Link2,
  ArrowRight
} from "lucide-react";
import { useAIInsightsEngine, CrossInsight } from "@/hooks/useAIInsightsEngine";
import { motion } from "framer-motion";

const getInsightIcon = (type: CrossInsight['type']) => {
  switch (type) {
    case 'correlation': return <Link2 className="h-4 w-4" />;
    case 'pattern': return <TrendingUp className="h-4 w-4" />;
    case 'prediction': return <AlertTriangle className="h-4 w-4" />;
    case 'opportunity': return <Lightbulb className="h-4 w-4" />;
    default: return <Brain className="h-4 w-4" />;
  }
};

const getInsightColor = (type: CrossInsight['type']) => {
  switch (type) {
    case 'correlation': return 'bg-primary/10 text-primary border-primary/20';
    case 'pattern': return 'bg-info/10 text-info border-info/20';
    case 'prediction': return 'bg-warning/10 text-warning border-warning/20';
    case 'opportunity': return 'bg-success/10 text-success border-success/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getPriorityColor = (priority: CrossInsight['priority']) => {
  switch (priority) {
    case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'medium': return 'bg-warning/20 text-warning border-warning/30';
    case 'low': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted';
  }
};

const typeLabels: Record<CrossInsight['type'], string> = {
  correlation: 'Corrélation',
  pattern: 'Pattern',
  prediction: 'Prédiction',
  opportunity: 'Opportunité'
};

export function CrossInsightsWidget() {
  const { insights, summary, isLoading, refreshInsights } = useAIInsightsEngine();

  if (isLoading && insights.length === 0) {
    return (
      <Card className="dashboard-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Découvrez des corrélations cachées dans vos données</p>
          <Button onClick={refreshInsights} disabled={isLoading}>
            <Brain className="h-4 w-4 mr-2" />
            Analyser mes données
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-heading">
              <div className="p-2 rounded-lg bg-gradient-to-br from-info/20 to-primary/20">
                <Brain className="h-5 w-5 text-info" />
              </div>
              <div>
                <span>Insights Croisés</span>
                <span className="text-muted-foreground text-sm font-normal ml-2">IA</span>
              </div>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshInsights}
              disabled={isLoading}
              className="hover:bg-info/10"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {summary && (
            <p className="text-sm text-muted-foreground mt-2">{summary}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Icon & Type */}
                <div className={`p-2 rounded-lg ${getInsightColor(insight.type)} flex-shrink-0`}>
                  {insight.icon ? (
                    <span className="text-lg">{insight.icon}</span>
                  ) : (
                    getInsightIcon(insight.type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={`text-xs ${getInsightColor(insight.type)}`}>
                      {typeLabels[insight.type]}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                      {insight.priority === 'high' ? '⚡ Priorité' : insight.priority === 'medium' ? 'Moyen' : 'Info'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{insight.description}</p>

                  {/* Action */}
                  {insight.action && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-3 w-3" />
                      <span>{insight.action}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
