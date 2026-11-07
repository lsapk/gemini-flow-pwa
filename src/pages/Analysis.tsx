import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Brain, RefreshCw } from "lucide-react";
import {
  SimpleAreaChart,
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
} from "@/components/ui/custom-charts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useProductivityScore } from "@/hooks/useProductivityScore";
import { useAIProductivityInsights } from "@/hooks/useAIProductivityInsights";
import { InsightCard } from "@/components/ui/InsightCard";

export default function Analysis() {
  const analytics = useAnalyticsData();
  const { data: score } = useProductivityScore();
  const ai = useAIProductivityInsights();
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="page-intro flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Analyse de vos activités</h1>
          <p className="text-muted-foreground">
            Vos données enregistrées, sans requête IA automatique.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={analytics.refetch}
          disabled={analytics.isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
      {analytics.error && (
        <p role="alert" className="text-destructive">
          {analytics.error}
        </p>
      )}
      {analytics.isLoading ? (
        <p role="status">Chargement des statistiques…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Indicateur d’activité local</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-semibold">
                {score.score}
                <span className="text-xl text-muted-foreground"> /100</span>
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                {score.calculationMethod}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Un repère pour vos activités enregistrées, sans évaluation de
                votre valeur personnelle.
              </p>
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tâches par priorité</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.tasksData.length ? (
                  <SimpleLineChart
                    data={analytics.tasksData}
                    lines={[
                      {
                        dataKey: "completed",
                        name: "Terminées",
                        color: "#10B981",
                      },
                      { dataKey: "pending", name: "À faire", color: "#7C3AED" },
                    ]}
                  />
                ) : (
                  <p>Aucune tâche enregistrée.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Séries d’habitudes</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.habitsData.length ? (
                  <SimpleBarChart data={analytics.habitsData} color="#10B981" />
                ) : (
                  <p>Aucune habitude enregistrée.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Focus sur sept jours (minutes)</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleAreaChart
                  data={analytics.focusData.map((entry) => ({
                    name: entry.date,
                    value: entry.minutes,
                  }))}
                  color="#3B82F6"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Activités enregistrées sur sept jours</CardTitle>
              </CardHeader>
              <CardContent>
                <SimplePieChart
                  data={analytics.activityData.map((entry) => ({
                    name: entry.date,
                    value: entry.count,
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Créations de séances et de notes, dernières mises à jour des
                  tâches et habitudes. Une modification répétée n’est pas un
                  historique exhaustif.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Conseils IA à votre demande
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Un clic utilise 1 crédit et transmet vos tâches, habitudes,
            objectifs et séances récentes au fournisseur Google Gemini. Votre
            journal et vos réflexions sont exclus.
          </p>
          <Button onClick={ai.generateInsights} disabled={ai.isLoading}>
            {ai.isLoading
              ? "Analyse en cours…"
              : "Générer 3 conseils · 1 crédit"}
          </Button>
          {ai.error && (
            <p role="alert" className="text-destructive">
              {ai.error}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-3">
            {ai.insights.map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                insight={insight.insight}
                recommendation={insight.recommendation}
                priority={insight.priority}
                icon={BarChart3}
                metric={insight.metric}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
