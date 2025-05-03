
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TargetIcon } from "@/components/icons/DeepFlowIcons";

const Goals = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TargetIcon className="h-8 w-8" />
          Objectifs
        </h1>
        <p className="text-muted-foreground">
          Définissez vos objectifs à long terme et suivez votre progression.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Mes objectifs</CardTitle>
          <CardDescription>
            Visualisez et suivez vos objectifs personnels et professionnels.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p>Le contenu des objectifs sera implémenté dans la prochaine version.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;
