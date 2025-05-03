
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheckIcon } from "@/components/icons/DeepFlowIcons";

const Habits = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheckIcon className="h-8 w-8" />
          Suivi d'habitudes
        </h1>
        <p className="text-muted-foreground">
          Créez et suivez vos habitudes quotidiennes pour atteindre vos objectifs.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Mes habitudes</CardTitle>
          <CardDescription>
            Suivez vos habitudes quotidiennes et maintenez votre progression.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p>Le contenu des habitudes sera implémenté dans la prochaine version.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Habits;
