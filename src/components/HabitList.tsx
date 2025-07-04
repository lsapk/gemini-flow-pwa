
import { Habit } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, Edit, Archive, ArchiveRestore } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HabitListProps {
  habits: Habit[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (habit: Habit) => void;
  onComplete?: (id: string, isCompleted: boolean) => void;
  onRefresh: () => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  showArchived?: boolean;
}

export default function HabitList({ 
  habits, 
  loading, 
  onDelete, 
  onEdit, 
  onComplete, 
  onArchive,
  onUnarchive,
  showArchived 
}: HabitListProps) {
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

  // Grouping by category (seulement pour les habitudes actives)
  const habitsByCategory = !showArchived ? {
    health: habits.filter((h) => h.category === "health"),
    productivity: habits.filter((h) => h.category === "productivity"),
    personal: habits.filter((h) => h.category === "personal"),
    other: habits.filter(
      (h) =>
        !h.category ||
        !["health", "productivity", "personal"].includes(h.category)
    ),
  } : {};

  const categoryLabels = {
    health: { name: "Santé", color: getCategoryColor("health"), emoji: "🏃" },
    productivity: { name: "Productivité", color: getCategoryColor("productivity"), emoji: "⚡" },
    personal: { name: "Personnel", color: getCategoryColor("personal"), emoji: "🎯" },
    other: { name: "Autre", color: getCategoryColor("other"), emoji: "📝" },
  };

  return (
    <div className="space-y-6">
      {/* Cartes catégorie seulement pour les habitudes actives */}
      {!showArchived && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const habitsInCategory = habitsByCategory[key as keyof typeof habitsByCategory] || [];
            const count = habitsInCategory.length;
            const completedToday = habitsInCategory.filter(h => h.is_completed_today).length;

            return (
              <Card
                key={key}
                className="flex h-auto sm:h-[110px] px-2 py-2 sm:p-4 items-center transition-shadow"
              >
                <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
                  <div
                    className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${label.color.bg}`}
                  >
                    <span className="text-xl sm:text-3xl">{label.emoji}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:gap-1">
                    <div className={`font-semibold text-xs sm:text-base ${label.color.text}`}>
                      {label.name}
                    </div>
                    <div className="text-[10px] sm:text-sm text-muted-foreground">
                      {count} habitude{count > 1 ? "s" : ""}
                    </div>
                    {count > 0 && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        Aujourd'hui : {completedToday} / {count}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Liste détaillée des habitudes */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <Card key={habit.id} className={`hover:shadow-sm transition-shadow ${showArchived ? 'opacity-75' : ''}`}>
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
                    {showArchived && (
                      <Badge variant="outline">Archivée</Badge>
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
                    {habit.streak != null && habit.streak > 0 && (
                      <span>🔥 Série: {habit.streak}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {!showArchived && onComplete && (
                    <Button
                      size="lg"
                      onClick={() => onComplete(habit.id, habit.is_completed_today)}
                      className={`h-14 w-14 sm:h-20 sm:w-20 p-0 rounded-full transition-colors flex items-center justify-center 
                        ${
                          habit.is_completed_today 
                            ? "text-white bg-green-600 hover:bg-green-700" 
                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        }`}
                      aria-label={habit.is_completed_today ? "Décocher l'habitude" : "Cocher l'habitude"}
                    >
                      <CheckCircle className="h-9 w-9 sm:h-12 sm:w-12" />
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
                  
                  {showArchived ? (
                    onUnarchive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnarchive(habit.id)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    )
                  ) : (
                    onArchive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onArchive(habit.id)}
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )
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
