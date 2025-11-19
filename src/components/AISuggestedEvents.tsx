import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, Plus, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface SuggestedEvent {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
}

interface AISuggestedEventsProps {
  events: SuggestedEvent[];
  onCreateEvent: (event: SuggestedEvent) => Promise<void>;
}

export function AISuggestedEvents({ events, onCreateEvent }: AISuggestedEventsProps) {
  const [creatingIds, setCreatingIds] = useState<Set<number>>(new Set());

  if (!events || events.length === 0) return null;

  const handleCreate = async (event: SuggestedEvent, index: number) => {
    setCreatingIds(prev => new Set(prev).add(index));
    try {
      await onCreateEvent(event);
      toast.success("Événement créé avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la création de l'événement");
    } finally {
      setCreatingIds(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Événements suggérés par l'IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => {
          const start = new Date(event.startDateTime);
          const end = new Date(event.endDateTime);
          const isCreating = creatingIds.has(index);

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-sm">{event.title}</h4>
                {event.description && (
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(start, "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(start, "HH:mm")} - {format(end, "HH:mm")}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleCreate(event, index)}
                disabled={isCreating}
                className="shrink-0"
              >
                {isCreating ? (
                  "Création..."
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
