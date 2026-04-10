import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Target, Archive, CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSoundService } from "@/hooks/useSoundService";
import { calculateStreak } from "@/services/streakCalculator";
import CreateModal from "@/components/modals/CreateModal";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import HabitList from "@/components/HabitList";
import { Habit } from "@/types";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const sound = useSoundService();

  // Keep a stable reference to today's date string to avoid drift
  const todayStr = useRef(formatLocalDate(new Date()));

  const isViewingToday = formatLocalDate(selectedDate) === todayStr.current;

  const completedToday = habits.filter(h => h.is_completed_today).length;
  const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  const updateHabitInLists = useCallback((habitId: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...updates } : h));
    setArchivedHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...updates } : h));
  }, []);

  const hasAttemptedStreakRepair = useRef(false);

  const repairHabitsStreaks = useCallback(async (habitsToRepair: Habit[]) => {
    if (!user || habitsToRepair.length === 0 || hasAttemptedStreakRepair.current) return;

    hasAttemptedStreakRepair.current = true;

    const repaired = await Promise.all(
      habitsToRepair.map(async (habit) => {
        const computedStreak = await calculateStreak(habit.id, user.id, habit.days_of_week);
        const storedStreak = habit.streak || 0;

        if (computedStreak === storedStreak) return null;

        const { error: updateError } = await supabase
          .from('habits')
          .update({ streak: computedStreak })
          .eq('id', habit.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Unable to repair streak for habit ${habit.id}:`, updateError);
          return null;
        }

        return { habitId: habit.id, streak: computedStreak };
      })
    );

    repaired.filter(Boolean).forEach((item) => {
      if (!item) return;
      updateHabitInLists(item.habitId, { streak: item.streak });
    });
  }, [user, updateHabitInLists]);

  const fetchHabits = async (dateToUse: Date = selectedDate) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const targetDate = formatLocalDate(dateToUse);
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitsWithCompletion = await Promise.all(
        (data || []).map(async (habit) => {
          const { data: completion } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('habit_id', habit.id)
            .eq('completed_date', targetDate)
            .maybeSingle();

          const selectedDay = dateToUse.getDay();
          const shouldShowForDate = !habit.days_of_week || habit.days_of_week.length === 0 || habit.days_of_week.includes(selectedDay);

          return {
            ...habit,
            frequency: habit.frequency as 'daily' | 'weekly' | 'monthly',
            is_completed_today: !!completion,
            should_show_today: shouldShowForDate
          };
        })
      );

      const active = habitsWithCompletion.filter(h => !h.is_archived && h.should_show_today);
      const archived = habitsWithCompletion.filter(h => h.is_archived);
      
      const normalizedActive = active.map(({ should_show_today, ...habit }) => habit as Habit);
      const normalizedArchived = archived.map(({ should_show_today, ...habit }) => habit as Habit);

      setHabits(normalizedActive);
      setArchivedHabits(normalizedArchived);

      if (isViewingToday) {
        void repairHabitsStreaks([...(normalizedActive || []), ...(normalizedArchived || [])]);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Erreur lors du chargement des habitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hasAttemptedStreakRepair.current = false;
  }, [user?.id]);

  useEffect(() => {
    // Update todayStr on mount
    todayStr.current = formatLocalDate(new Date());
    fetchHabits();
  }, [user, selectedDate]);

  const handleEdit = (habit: Habit) => { setEditingHabit(habit); setIsEditModalOpen(true); };
  const requestDelete = (habitId: string) => { setHabitToDelete(habitId); setIsDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!user || !habitToDelete) return;
    try {
      const { error } = await supabase.from('habits').delete().eq('id', habitToDelete).eq('user_id', user.id);
      if (error) throw error;
      sound.playDelete();
      toast.success('Habitude supprimée !');
      fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Erreur lors de la suppression de l\'habitude');
    } finally {
      setIsDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };

  const toggleArchive = async (habitId: string, isArchived: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('habits').update({ is_archived: !isArchived }).eq('id', habitId);
      if (error) throw error;
      toast.success(isArchived ? 'Habitude restaurée !' : 'Habitude archivée !');
      fetchHabits();
    } catch (error) {
      console.error('Error toggling archive:', error);
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const toggleHabitCompletion = async (habitId: string, isCompleted: boolean) => {
    if (!user) return;
    const currentSelectedDate = new Date(selectedDate);
    const targetDate = formatLocalDate(currentSelectedDate);

    const habit = habits.find(h => h.id === habitId) || archivedHabits.find(h => h.id === habitId);
    if (habit?.days_of_week && habit.days_of_week.length > 0) {
      const selectedDay = currentSelectedDate.getDay();
      if (!habit.days_of_week.includes(selectedDay)) {
        sound.playError();
        toast.error("Cette habitude n'est pas prévue pour cette date");
        return;
      }
    }

    // Optimistic update
    updateHabitInLists(habitId, { is_completed_today: !isCompleted });

    try {
      if (isCompleted) {
        // Uncheck: delete completion
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .eq('completed_date', targetDate);
        if (deleteError) throw deleteError;

        sound.playUncomplete();

        // Recalculate streak from actual data
        const newStreak = await calculateStreak(habitId, user.id, habit?.days_of_week);
        await supabase.from('habits').update({ streak: newStreak }).eq('id', habitId);
        updateHabitInLists(habitId, { streak: newStreak });

        toast.info("L'habitude n'est plus marquée comme faite.");
      } else {
        // Check: insert completion
        const { error } = await supabase
          .from('habit_completions')
          .insert({ habit_id: habitId, user_id: user.id, completed_date: targetDate });
        if (error) throw error;

        sound.playComplete();

        // Recalculate streak from actual data
        const newStreak = await calculateStreak(habitId, user.id, habit?.days_of_week);
        const completedAt = new Date().toISOString();
        await supabase.from('habits').update({ 
          last_completed_at: completedAt, 
          streak: newStreak 
        }).eq('id', habitId);
        updateHabitInLists(habitId, {
          streak: newStreak,
          last_completed_at: completedAt,
        });

        // Rewards only when viewing today — placeholder for future feature

        // Check streak milestones
        if (newStreak > 0 && newStreak % 7 === 0) {
          sound.playStreakMilestone();
        }

        toast.success('Habitude complétée !');
      }

      // Check if all habits are now completed
      const updatedHabits = habits.map(h => h.id === habitId ? { ...h, is_completed_today: !isCompleted } : h);
      const allDone = updatedHabits.length > 0 && updatedHabits.every(h => h.is_completed_today);
      if (allDone && !isCompleted) {
        setTimeout(() => sound.playSuccess(), 300);
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      // Revert optimistic update
      updateHabitInLists(habitId, { is_completed_today: isCompleted });
      sound.playError();
      toast.error("Erreur lors de la mise à jour de l'habitude");
    }
  };

  const handleCreateSuccess = () => { 
    setIsCreateModalOpen(false); 
    sound.playCreate();
    fetchHabits(); 
  };
  const handleEditSuccess = () => { setIsEditModalOpen(false); setEditingHabit(null); fetchHabits(); };

  const handleReorder = async (reorderedHabits: Habit[]) => {
    if (activeTab === "active") setHabits(reorderedHabits);
    else setArchivedHabits(reorderedHabits);

    try {
      const updates = reorderedHabits.map((habit, index) => 
        supabase.from('habits').update({ sort_order: index }).eq('id', habit.id).eq('user_id', user?.id)
      );
      await Promise.all(updates);
    } catch (error) {
      console.error('Error saving habit order:', error);
      toast.error("Erreur lors de la sauvegarde de l'ordre");
      fetchHabits();
    }
  };

  const currentHabits = activeTab === "active" ? habits : archivedHabits;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Habitudes</h1>
            {habits.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {completedToday}/{habits.length} {isViewingToday ? "aujourd'hui" : format(selectedDate, "dd/MM", { locale: fr })}
                </span>
                <Progress value={completionRate} className="w-24 h-1.5" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isViewingToday && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => setSelectedDate(new Date())}
              >
                Aujourd'hui
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal text-xs sm:text-sm rounded-xl",
                    !selectedDate && "text-muted-foreground"
                  )}
                  size="sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: fr }) : "Date"}</span>
                  <span className="sm:hidden">{selectedDate ? format(selectedDate, "dd/MM", { locale: fr }) : "Date"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={fr}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Nouvelle habitude</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>

        {/* Date indicator when not viewing today */}
        {!isViewingToday && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 text-center">
            📅 Vous consultez le {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Actives ({habits.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archivées ({archivedHabits.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="grid gap-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse backdrop-blur-sm bg-card/60">
                        <CardContent className="p-4">
                          <div className="h-5 bg-muted/60 rounded-xl mb-3"></div>
                          <div className="h-4 bg-muted/40 rounded-xl w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : currentHabits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-card/30 rounded-3xl border border-border/40 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <RefreshCw className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{activeTab === "active" ? "Pas encore d'habitudes" : "Aucune habitude archivée"}</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">{activeTab === "active" ? "Créez de bonnes habitudes pour améliorer votre productivité." : "Les habitudes archivées apparaîtront ici."}</p>
                    {activeTab === "active" && (
                      <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />Créer votre première habitude
                      </Button>
                    )}
                  </div>
                ) : (
                  <HabitList 
                    habits={currentHabits}
                    loading={isLoading}
                    onDelete={requestDelete}
                    onEdit={handleEdit}
                    onComplete={toggleHabitCompletion}
                    onRefresh={fetchHabits}
                    onArchive={toggleArchive}
                    onReorder={handleReorder}
                    showArchived={activeTab === "archived"}
                  />
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

      {isCreateModalOpen && <CreateModal type="habit" onSuccess={handleCreateSuccess} />}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'habitude</DialogTitle>
          </DialogHeader>
          <CreateHabitForm onSuccess={handleEditSuccess} habit={editingHabit} />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'habitude sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
