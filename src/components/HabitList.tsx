
import { Habit } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HabitListProps {
  habits: Habit[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function HabitList({ habits, loading, onDelete }: HabitListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Circle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Aucune habitude</h3>
              <p className="text-sm text-muted-foreground">
                Commencez par créer votre première habitude
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "health":
        return "bg-green-100 text-green-800";
      case "productivity":
        return "bg-blue-100 text-blue-800";
      case "personal":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Quotidienne";
      case "weekly":
        return "Hebdomadaire";
      case "monthly":
        return "Mensuelle";
      default:
        return frequency;
    }
  };

  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <Card key={habit.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm sm:text-base">{habit.title}</h3>
                  {habit.category && (
                    <Badge variant="secondary" className={getCategoryColor(habit.category)}>
                      {habit.category}
                    </Badge>
                  )}
                </div>
                
                {habit.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {habit.description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>📅 {getFrequencyLabel(habit.frequency)}</span>
                  <span>🎯 Objectif: {habit.target}</span>
                  {habit.streak && habit.streak > 0 && (
                    <span>🔥 Série: {habit.streak}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(habit.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
