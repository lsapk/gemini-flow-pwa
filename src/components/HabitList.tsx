
import { Habit } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HabitListProps {
  habits: Habit[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (habit: Habit) => void;
  onComplete?: (id: string) => void;
  onRefresh: () => void;
}

export default function HabitList({ habits, loading, onDelete, onEdit, onComplete }: HabitListProps) {
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

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "health":
        return { bg: "bg-green-100", text: "text-green-800", icon: "text-green-600" };
      case "productivity":
        return { bg: "bg-blue-100", text: "text-blue-800", icon: "text-blue-600" };
      case "personal":
        return { bg: "bg-purple-100", text: "text-purple-800", icon: "text-purple-600" };
      default:
        return { bg: "bg-orange-100", text: "text-orange-800", icon: "text-orange-600" };
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

  // Grouping by category
  const habitsByCategory = {
    health: habits.filter((h) => h.category === "health"),
    productivity: habits.filter((h) => h.category === "productivity"),
    personal: habits.filter((h) => h.category === "personal"),
    other: habits.filter(
      (h) =>
        !h.category ||
        !["health", "productivity", "personal"].includes(h.category)
    ),
  };

  const categoryLabels = {
    health: { name: "Santé", color: getCategoryColor("health") },
    productivity: { name: "Productivité", color: getCategoryColor("productivity") },
    personal: { name: "Personnel", color: getCategoryColor("personal") },
    other: { name: "Autre", color: getCategoryColor("other") },
  };

  return (
    <div className="space-y-6">
      {/* Cartes catégorie */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = habitsByCategory[key as keyof typeof habitsByCategory]?.length || 0;
          const streak = habitsByCategory[key as keyof typeof habitsByCategory]?.reduce((sum, h) => sum + (h.streak || 0), 0);

          return (
            <Card key={key}>
              <CardContent className="p-5 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${label.color.bg}`}>
                  <span className={`text-2xl ${label.color.icon}`}>
                    {key === 'health' ? '🏃' : key === 'productivity' ? '⚡' : key === 'personal' ? '🎯' : '📝'}
                  </span>
                </div>
                <div className={`font-semibold ${label.color.text}`}>{label.name}</div>
                <div className="text-xs text-muted-foreground">{count} habitude{count > 1 ? "s" : ""}</div>
                {count > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">Série totale : {streak}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Liste détaillée des habitudes */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <Card key={habit.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm sm:text-base">{habit.title}</h3>
                    {habit.category && (
                      <Badge variant="secondary" className={`${getCategoryColor(habit.category).bg} ${getCategoryColor(habit.category).text}`}>
                        {habit.category === 'health' ? 'Santé' : 
                         habit.category === 'productivity' ? 'Productivité' : 
                         habit.category === 'personal' ? 'Personnel' : habit.category}
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
                  {onComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onComplete(habit.id)}
                      disabled={habit.is_completed_today}
                      className={`h-8 w-8 p-0 ${
                        habit.is_completed_today 
                          ? "text-green-600 bg-green-50" 
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(habit)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
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
    </div>
  );
}

