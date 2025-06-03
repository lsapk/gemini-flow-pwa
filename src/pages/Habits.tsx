import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Habit } from "@/types";
import { getHabits, deleteHabit } from "@/lib/api";
import CreateModal from "@/components/modals/CreateModal";
import FrequencyTabs from "@/components/ui/FrequencyTabs";
import HabitList from "@/components/HabitList";
import { CalendarDays, Flame, ListChecks, Repeat } from "@/components/icons/DeepFlowIcons";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFrequency, setActiveFrequency] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await getHabits();
      
      if (error) throw new Error(error.message);
      
      setHabits(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos habitudes.",
        variant: "destructive",
      });
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      const { error } = await deleteHabit(id);
      
      if (error) throw new Error(error.message);
      
      setHabits(habits.filter((habit) => habit.id !== id));
      
      toast({
        title: "Habitude supprimée",
        description: "Votre habitude a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'habitude.",
        variant: "destructive",
      });
      console.error("Error deleting habit:", error);
    }
  };

  const frequencies = [
    { key: "all", label: "Toutes", count: habits.length },
    { key: "daily", label: "Quotidiennes", count: habits.filter((h) => h.frequency === "daily").length },
    { key: "weekly", label: "Hebdomadaires", count: habits.filter((h) => h.frequency === "weekly").length },
    { key: "monthly", label: "Mensuelles", count: habits.filter((h) => h.frequency === "monthly").length },
  ];

  const filteredHabits = activeFrequency === "all"
    ? habits
    : habits.filter((habit) => habit.frequency === activeFrequency);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Habitudes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Développez de bonnes habitudes pour améliorer votre quotidien
          </p>
        </div>
        
        <CreateModal
          type="habit"
          onSuccess={fetchHabits}
        />
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{habits.length}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">🔄</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Séries actives</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">
                  {habits.filter(h => h.streak && h.streak > 0).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">🔥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Quotidiennes</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  {habits.filter(h => h.frequency === 'daily').length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-600">Meilleure série</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                  {Math.max(...habits.map(h => h.streak || 0), 0)}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FrequencyTabs
        frequencies={frequencies}
        activeFrequency={activeFrequency}
        onFrequencyChange={setActiveFrequency}
      />

      <HabitList
        habits={filteredHabits}
        loading={loading}
        onDelete={handleDeleteHabit}
        onRefresh={fetchHabits}
      />
    </div>
  );
}
