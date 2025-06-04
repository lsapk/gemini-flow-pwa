import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CreateModal from "@/components/modals/CreateModal";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
import { 
  Plus, 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle2,
  Circle,
  Edit,
  Trash2,
  Filter
} from "lucide-react";
import { Habit, HabitCompletion } from "@/types";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [loading, setLoading] = useState(true);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadHabits();
      loadCompletions();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHabits(data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les habitudes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompletions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setCompletions(data || []);
    } catch (error) {
      console.error('Error loading completions:', error);
    }
  };

  const toggleHabitCompletion = async (habit: Habit) => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const existingCompletion = completions.find(
      c => c.habit_id === habit.id && c.completed_date === today
    );

    try {
      if (existingCompletion) {
        // Décocher - supprimer la completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        // Mettre à jour la streak
        const newStreak = Math.max((habit.streak || 0) - 1, 0);
        await supabase
          .from('habits')
          .update({ 
            streak: newStreak,
            last_completed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', habit.id);

        setCompletions(prev => prev.filter(c => c.id !== existingCompletion.id));
        setHabits(prev => prev.map(h => 
          h.id === habit.id 
            ? { ...h, streak: newStreak, last_completed_at: null }
            : h
        ));

        toast({
          title: "Habitude décochée",
          description: `${habit.title} a été marquée comme non complétée aujourd'hui.`,
        });
      } else {
        // Cocher - ajouter une completion
        const { data: newCompletion, error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habit.id,
            user_id: user.id,
            completed_date: today
          })
          .select()
          .single();

        if (error) throw error;

        // Mettre à jour la streak
        const newStreak = (habit.streak || 0) + 1;
        await supabase
          .from('habits')
          .update({ 
            streak: newStreak,
            last_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', habit.id);

        setCompletions(prev => [...prev, newCompletion]);
        setHabits(prev => prev.map(h => 
          h.id === habit.id 
            ? { ...h, streak: newStreak, last_completed_at: new Date().toISOString() }
            : h
        ));

        toast({
          title: "Habitude complétée !",
          description: `Félicitations ! Votre série pour ${habit.title} est maintenant de ${newStreak} jour(s).`,
        });
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'habitude.",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;

      setHabits(prev => prev.filter(h => h.id !== habitId));
      toast({
        title: "Habitude supprimée",
        description: "L'habitude a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'habitude.",
        variant: "destructive",
      });
    }
  };

  const isHabitCompletedToday = (habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.completed_date === today);
  };

  const filteredHabits = habits.filter(habit => {
    if (filter === 'all') return true;
    return habit.frequency === filter;
  });

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          <h1 className="text-2xl sm:text-3xl font-bold">Mes Habitudes</h1>
        </div>
        
        <CreateModal
          type="habit"
          onSuccess={loadHabits}
        />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{habits.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complétées aujourd'hui</p>
                <p className="text-2xl font-bold">
                  {habits.filter(h => isHabitCompletedToday(h.id)).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Série moyenne</p>
                <p className="text-2xl font-bold">
                  {habits.length > 0 
                    ? Math.round(habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length)
                    : 0
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtrer par fréquence :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'daily', label: 'Quotidiennes' },
              { key: 'weekly', label: 'Hebdomadaires' },
              { key: 'monthly', label: 'Mensuelles' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des habitudes */}
      <div className="space-y-4">
        {filteredHabits.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Aucune habitude trouvée</p>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première habitude pour développer une routine positive.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHabits.map((habit) => {
            const isCompleted = isHabitCompletedToday(habit.id);
            const progress = habit.target > 0 ? Math.min((habit.streak || 0) / habit.target * 100, 100) : 0;
            
            return (
              <Card key={habit.id} className={`transition-all duration-200 ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-1 h-8 w-8 rounded-full ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}
                          onClick={() => toggleHabitCompletion(habit)}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <Circle className="h-6 w-6" />
                          )}
                        </Button>
                        <h3 className={`font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.title}
                        </h3>
                      </div>
                      
                      {habit.description && (
                        <p className="text-sm text-muted-foreground mb-2 ml-11">
                          {habit.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 ml-11">
                        <Badge className={getFrequencyColor(habit.frequency)}>
                          {getFrequencyText(habit.frequency)}
                        </Badge>
                        
                        {habit.category && (
                          <Badge variant="outline">{habit.category}</Badge>
                        )}
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>{habit.streak || 0} jour(s)</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span>Objectif: {habit.target}</span>
                        </div>
                      </div>
                      
                      {habit.target > 0 && (
                        <div className="ml-11 mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progrès vers l'objectif</span>
                            <span>{habit.streak || 0}/{habit.target}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingHabit(habit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) {
                            deleteHabit(habit.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {habit.last_completed_at && (
                    <div className="ml-11 text-xs text-muted-foreground">
                      Dernière fois: {format(new Date(habit.last_completed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal d'édition */}
      {editingHabit && (
        <CreateModal
          type="habit"
          onSuccess={() => {
            loadHabits();
            setEditingHabit(null);
          }}
        />
      )}
    </div>
  );
}
