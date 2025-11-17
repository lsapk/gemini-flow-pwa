import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CalendarItem } from "@/hooks/useCalendarData";
import { CheckCircle2, Circle, Target, Zap, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarDayViewProps {
  items: CalendarItem[];
  date: Date;
  onItemClick?: (item: CalendarItem) => void;
}

export function CalendarDayView({ items, date, onItemClick }: CalendarDayViewProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'habit':
        return <Zap className="h-4 w-4" />;
      case 'goal':
        return <Target className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Tâche';
      case 'habit':
        return 'Habitude';
      case 'goal':
        return 'Objectif';
      default:
        return 'Événement';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'habit':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'goal':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, CalendarItem[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun événement prévu pour cette date
          </p>
        ) : (
          <>
            {Object.entries(groupedItems).map(([type, typeItems]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {getIcon(type)}
                  <span>{getTypeLabel(type)}s ({typeItems.length})</span>
                </div>
                <div className="space-y-2 pl-6">
                  {typeItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        getTypeColor(item.type),
                        item.completed && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.completed !== undefined && (
                              item.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )
                            )}
                            <span className={cn(
                              "font-medium",
                              item.completed && "line-through"
                            )}>
                              {item.title}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 ml-6">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.priority && (
                          <Badge variant={
                            item.priority === 'high' ? 'destructive' :
                            item.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {item.priority}
                          </Badge>
                        )}
                        {item.category && (
                          <Badge variant="outline">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
