
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartes d'état vides */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Circle className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-medium text-green-700 mb-1">Santé</h3>
            <p className="text-sm text-muted-foreground">0 habitude</p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Circle className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-blue-700 mb-1">Productivité</h3>
            <p className="text-sm text-muted-foreground">0 habitude</p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Circle className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="font-medium text-purple-700 mb-1">Personnel</h3>
            <p className="text-sm text-muted-foreground">0 habitude</p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Circle className="h-4 w-4 text-orange-600" />
            </div>
            <h3 className="font-medium text-orange-700 mb-1">Autre</h3>
            <p className="text-sm text-muted-foreground">0 habitude</p>
          </CardContent>
        </Card>
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

  // Grouper les habitudes par catégorie pour l'affichage en cartes
  const habitsByCategory = {
    health: habits.filter(h => h.category === 'health'),
    productivity: habits.filter(h => h.category === 'productivity'),
    personal: habits.filter(h => h.category === 'personal'),
    other: habits.filter(h => !h.category || !['health', 'productivity', 'personal'].includes(h.category))
  };

  const categoryLabels = {
    health: { name: 'Santé', color: getCategoryColor('health') },
    productivity: { name: 'Productivité', color: getCategoryColor('productivity') },
    personal: { name: 'Personnel', color: getCategoryColor('personal') },
    other: { name: 'Autre', color: getCategoryColor('other') }
  };

  return (
    <div className="space-y-6">
      {/* Vue en cartes par catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(habitsByCategory).map(([category, categoryHabits]) => {
          const label = categoryLabels[category as keyof typeof categoryLabels];
          const totalStreak = categoryHabits.reduce((sum, habit) => sum + (habit.streak || 0), 0);
          
          return (
            <Card key={category} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`w-8 h-8 ${label.color.bg} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                  <Circle className={`h-4 w-4 ${label.color.icon}`} />
                </div>
                <h3 className={`font-medium mb-1 ${label.color.text}`}>{label.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {categoryHabits.length} habitude{categoryHabits.length > 1 ? 's' : ''}
                </p>
                {categoryHabits.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    🔥 Série totale: {totalStreak}
                  </div>
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
    </div>
  );
}
