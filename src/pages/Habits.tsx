import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Target, 
  Calendar,
  Flame,
  CheckCircle,
  Filter,
  Edit,
  Trash2
} from "lucide-react";
import { Habit, HabitCompletion } from "@/types";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
import { format, isToday, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Sidebar from "@/components/layout/Sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import MobileHeader from "@/components/layout/MobileHeader";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<{ [key: string]: HabitCompletion[] }>({});
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  useEffect(() => {
    filterHabits();
  }, [habits, frequencyFilter]);

  const filterHabits = () => {
    let filtered = habits;
    if (frequencyFilter !== 'all') {
      filtered = habits.filter(habit => habit.frequency === frequencyFilter);
    }
    setFilteredHabits(filtered);
  };

  const loadHabits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitsWithStatus = await Promise.all(
        (data || []).map(async (habit) => {
          const completionData = await loadHabitCompletions(habit.id);
          return {
            ...habit,
            frequency: habit.frequency as 'daily' | 'weekly' | 'monthly',
            is_completed_today: completionData.some(comp => 
              isToday(new Date(comp.completed_date))
            )
          };
        })
      );

      setHabits(habitsWithStatus);
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

  const loadHabitCompletions = async (habitId: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', user?.id)
        .order('completed_date', { ascending: false });

      if (error) throw error;

      const completionData = data || [];
      setCompletions(prev => ({ ...prev, [habitId]: completionData }));
      return completionData;
    } catch (error) {
      console.error('Error loading habit completions:', error);
      return [];
    }
  };

  const toggleHabitCompletion = async (habit: Habit) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const existingCompletion = completions[habit.id]?.find(
        comp => comp.completed_date === today
      );

      if (existingCompletion) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        toast({
          title: "Habitude non marquée",
          description: `${habit.title} n'est plus marquée comme complétée aujourd'hui.`,
        });
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habit.id,
            user_id: user.id,
            completed_date: today
          });

        if (error) throw error;

        toast({
          title: "Habitude complétée !",
          description: `Bravo ! Vous avez complété ${habit.title} aujourd'hui.`,
        });
      }

      loadHabits();
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'habitude.",
        variant: "destructive",
      });
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsCreateOpen(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== habitId));
      
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

  const getStreakCount = (habitId: string) => {
    const habitCompletions = completions[habitId] || [];
    if (habitCompletions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const hasCompletion = habitCompletions.some(
        comp => comp.completed_date === dateString
      );
      
      if (hasCompletion) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const getWeeklyCompletions = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    let weeklyCount = 0;
    Object.values(completions).forEach(habitCompletions => {
      habitCompletions.forEach(completion => {
        const completionDate = new Date(completion.completed_date);
        if (completionDate >= start && completionDate <= end) {
          weeklyCount++;
        }
      });
    });
    
    return weeklyCount;
  };

  const getTodayCompletions = () => {
    return habits.filter(habit => habit.is_completed_today).length;
  };

  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingHabit(null);
    loadHabits();
  };

  const sidebarContent = <Sidebar onItemClick={() => setSidebarOpen(false)} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? (
          <>
            <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
            <div className="pt-14">
              <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Chargement...</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-screen w-full">
            {sidebarContent}
            <div className="flex-1">
              <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Chargement...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
          <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <DrawerContent>
              {sidebarContent}
            </DrawerContent>
          </Drawer>
          <div className="pt-14">
            <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Habitudes</h1>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                  setIsCreateOpen(open);
                  if (!open) setEditingHabit(null);
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle habitude
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingHabit ? 'Modifier l\'habitude' : 'Créer une nouvelle habitude'}
                      </DialogTitle>
                    </DialogHeader>
                    <CreateHabitForm 
                      habit={editingHabit}
                      onSuccess={handleFormSuccess}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{habits.length}</p>
                      </div>
                      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Complétées</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{getTodayCompletions()}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Aujourd'hui</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300">{getTodayCompletions()}</p>
                      </div>
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Cette semaine</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{getWeeklyCompletions()}</p>
                      </div>
                      <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtres */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Fréquence:</span>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant={frequencyFilter === 'all' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('all')}
                        className="text-xs"
                      >
                        Toutes
                      </Button>
                      <Button
                        variant={frequencyFilter === 'daily' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('daily')}
                        className="text-xs"
                      >
                        Quotidiennes
                      </Button>
                      <Button
                        variant={frequencyFilter === 'weekly' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('weekly')}
                        className="text-xs"
                      >
                        Hebdo
                      </Button>
                      <Button
                        variant={frequencyFilter === 'monthly' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('monthly')}
                        className="text-xs"
                      >
                        Mensuelles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des habitudes */}
              <div className="space-y-4">
                {filteredHabits.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {habits.length === 0 ? 'Aucune habitude créée' : 'Aucune habitude trouvée'}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {habits.length === 0 
                          ? 'Commencez par créer votre première habitude pour développer de bonnes routines.'
                          : 'Essayez de modifier vos filtres pour voir d\'autres habitudes.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredHabits.map((habit) => (
                    <Card key={habit.id} className={`transition-all ${habit.is_completed_today ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-base sm:text-lg break-words">{habit.title}</CardTitle>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {habit.frequency === 'daily' ? 'Quotidienne' : 
                                 habit.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}
                              </Badge>
                              {habit.category && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                  {habit.category}
                                </Badge>
                              )}
                            </div>
                            {habit.description && (
                              <p className="text-muted-foreground text-sm break-words">{habit.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditHabit(habit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHabit(habit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={habit.is_completed_today ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleHabitCompletion(habit)}
                              className={habit.is_completed_today ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span>Série: {getStreakCount(habit.id)} jours</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span>Objectif: {habit.target}</span>
                            </div>
                          </div>
                          
                          <span className="text-muted-foreground text-xs">
                            Créée le {format(new Date(habit.created_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-screen w-full">
          {sidebarContent}
          <div className="flex-1">
            <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl overflow-x-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Habitudes</h1>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                  setIsCreateOpen(open);
                  if (!open) setEditingHabit(null);
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle habitude
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingHabit ? 'Modifier l\'habitude' : 'Créer une nouvelle habitude'}
                      </DialogTitle>
                    </DialogHeader>
                    <CreateHabitForm 
                      habit={editingHabit}
                      onSuccess={handleFormSuccess}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statistiques améliorées */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{habits.length}</p>
                      </div>
                      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Complétées</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{getTodayCompletions()}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Aujourd'hui</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300">{getTodayCompletions()}</p>
                      </div>
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Cette semaine</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{getWeeklyCompletions()}</p>
                      </div>
                      <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtres compacts */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Fréquence:</span>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant={frequencyFilter === 'all' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('all')}
                        className="text-xs"
                      >
                        Toutes
                      </Button>
                      <Button
                        variant={frequencyFilter === 'daily' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('daily')}
                        className="text-xs"
                      >
                        Quotidiennes
                      </Button>
                      <Button
                        variant={frequencyFilter === 'weekly' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('weekly')}
                        className="text-xs"
                      >
                        Hebdo
                      </Button>
                      <Button
                        variant={frequencyFilter === 'monthly' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('monthly')}
                        className="text-xs"
                      >
                        Mensuelles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des habitudes */}
              <div className="space-y-4">
                {filteredHabits.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {habits.length === 0 ? 'Aucune habitude créée' : 'Aucune habitude trouvée'}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {habits.length === 0 
                          ? 'Commencez par créer votre première habitude pour développer de bonnes routines.'
                          : 'Essayez de modifier vos filtres pour voir d\'autres habitudes.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredHabits.map((habit) => (
                    <Card key={habit.id} className={`transition-all ${habit.is_completed_today ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-base sm:text-lg truncate">{habit.title}</CardTitle>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {habit.frequency === 'daily' ? 'Quotidienne' : 
                                 habit.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}
                              </Badge>
                              {habit.category && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                  {habit.category}
                                </Badge>
                              )}
                            </div>
                            {habit.description && (
                              <p className="text-muted-foreground text-sm break-words">{habit.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditHabit(habit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHabit(habit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={habit.is_completed_today ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleHabitCompletion(habit)}
                              className={habit.is_completed_today ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span>Série: {getStreakCount(habit.id)} jours</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span>Objectif: {habit.target}</span>
                            </div>
                          </div>
                          
                          <span className="text-muted-foreground text-xs">
                            Créée le {format(new Date(habit.created_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
