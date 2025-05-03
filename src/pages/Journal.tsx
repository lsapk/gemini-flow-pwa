
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenTextIcon } from "@/components/icons/DeepFlowIcons";

const Journal = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpenTextIcon className="h-8 w-8" />
          Journal personnel
        </h1>
        <p className="text-muted-foreground">
          Notez vos pensées, réflexions et accomplissements quotidiens.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Mon journal</CardTitle>
          <CardDescription>
            Un espace privé pour consigner vos pensées et vos émotions.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p>Le contenu du journal sera implémenté dans la prochaine version.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Journal;
