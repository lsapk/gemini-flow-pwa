
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLineIcon } from "@/components/icons/DeepFlowIcons";

const Analysis = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ChartLineIcon className="h-8 w-8" />
          Analyse IA
        </h1>
        <p className="text-muted-foreground">
          Obtenez des insights et des recommandations personnalisées basées sur vos données.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Insights personnalisés</CardTitle>
          <CardDescription>
            L'IA analyse vos habitudes et performances pour vous aider à vous améliorer.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p>L'analyse IA sera implémentée une fois l'intégration de Gemini complétée.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;
