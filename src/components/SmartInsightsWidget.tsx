import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useAIProductivityInsights } from "@/hooks/useAIProductivityInsights";

export function SmartInsightsWidget() {
  const ai = useAIProductivityInsights();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Conseils IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Générer des conseils transmet vos tâches, habitudes, objectifs et
          séances récentes à Google Gemini. Journal et réflexions exclus. Coût :
          1 crédit.
        </p>
        <Button onClick={ai.generateInsights} disabled={ai.isLoading}>
          {ai.isLoading
            ? "Analyse en cours…"
            : "Générer des conseils · 1 crédit"}
        </Button>
        {ai.error && (
          <p role="alert" className="text-sm text-destructive">
            {ai.error}
          </p>
        )}
        {ai.insights.map((insight) => (
          <article key={insight.id} className="rounded-lg border p-3 space-y-1">
            <h3 className="font-medium">{insight.title}</h3>
            <p className="text-sm text-muted-foreground">{insight.insight}</p>
            <p className="text-sm">{insight.recommendation}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
