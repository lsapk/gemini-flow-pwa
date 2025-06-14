
import { useState, useEffect } from "react";
import { Plus, Target, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import { Habit } from "@/types";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitsWithCompletion = await Promise.all(
        (data || []).map(async (habit) => {
          const today = new Date().toISOString().split('T')[0];
          const { data: completion } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('habit_id', habit.id)
            .eq('completed_date', today)
            .single();

          return {
            ...habit,
            frequency: habit.frequency as 'daily' | 'weekly' | 'monthly',
            is_completed_today: !!completion
          } as Habit;
        })
      );

      setHabits(habitsWithCompletion);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Erreur lors du chargement des habitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const completeHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: today
        });

      if (error) throw error;

      // Get current streak to increment it
      const { data: currentHabit } = await supabase
        .from('habits')
        .select('streak')
        .eq('id', habitId)
        .single();

      const newStreak = (currentHabit?.streak || 0) + 1;

      await supabase
        .from('habits')
        .update({
          last_completed_at: new Date().toISOString(),
          streak: newStreak
        })
        .eq('id', habitId);

      toast.success('Habitude complétée !');
      fetchHabits();
    } catch (error) {
      console.error('Error completing habit:', error);
      toast.error('Erreur lors de la completion de l\'habitude');
    }
  };

  const getStreakColor = (streak: number = 0) => {
    if (streak >= 30) return "bg-purple-500";
    if (streak >= 14) return "bg-green-500";
    if (streak >= 7) return "bg-blue-500";
    if (streak >= 3) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily': return <Clock className="h-4 w-4" />;
      case 'weekly': return <Target className="h-4 w-4" />;
      case 'monthly': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Habitudes</h1>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle habitude
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune habitude</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez à créer de bonnes habitudes pour améliorer votre productivité.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer votre première habitude
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {habits.map((habit) => (
            <Card key={habit.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{habit.title}</CardTitle>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground">
                        {habit.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFrequencyIcon(habit.frequency)}
                      {habit.frequency}
                    </Badge>
                    {habit.category && (
                      <Badge variant="secondary">{habit.category}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStreakColor(habit.streak)}`}></div>
                      <span className="text-sm font-medium">
                        Série: {habit.streak || 0} jour{(habit.streak || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Objectif: {habit.target} fois
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>{Math.min(habit.streak || 0, habit.target)}/{habit.target}</span>
                    </div>
                    <Progress 
                      value={Math.min(((habit.streak || 0) / habit.target) * 100, 100)} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      {habit.last_completed_at && (
                        <>Dernière fois: {new Date(habit.last_completed_at).toLocaleDateString()}</>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => completeHabit(habit.id)}
                      disabled={habit.is_completed_today}
                      className={habit.is_completed_today ? "bg-green-500 hover:bg-green-500" : ""}
                    >
                      {habit.is_completed_today ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complété
                        </>
                      ) : (
                        "Marquer comme fait"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateModal 
          type="habit"
          onSuccess={fetchHabits}
        />
      )}
    </div>
  );
}
