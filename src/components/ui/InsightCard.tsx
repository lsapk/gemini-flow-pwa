
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface InsightCardProps {
  title: string;
  insight: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  icon: LucideIcon;
  metric?: string;
}

export function InsightCard({ title, insight, recommendation, priority, icon: Icon, metric }: InsightCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Priorité élevée';
      case 'medium': return 'Priorité moyenne';
      case 'low': return 'Amélioration';
      default: return 'Info';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <Badge variant={getPriorityColor(priority)} className="text-xs">
              {getPriorityLabel(priority)}
            </Badge>
          </div>
          {metric && (
            <div className="text-2xl font-bold text-primary">{metric}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="font-medium text-sm text-muted-foreground mb-1">Analyse :</div>
            <p className="text-sm">{insight}</p>
          </div>
          <div>
            <div className="font-medium text-sm text-muted-foreground mb-1">Recommandation :</div>
            <p className="text-sm font-medium">{recommendation}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
