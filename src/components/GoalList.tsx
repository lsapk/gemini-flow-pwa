
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Target, Calendar, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Goal } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GoalListProps {
  goals: Goal[];
  loading?: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'personal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'professional': return 'bg-green-100 text-green-800 border-green-200';
    case 'health': return 'bg-red-100 text-red-800 border-red-200';
    case 'finance': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function GoalList({ goals, loading, onEdit, onDelete }: GoalListProps) {
  const { user } = useAuth();

  const updateProgress = async (goalId: string, currentProgress: number, increment: boolean) => {
    if (!user) return;
    
    const newProgress = increment 
      ? Math.min(100, currentProgress + 10)
      : Math.max(0, currentProgress - 10);
    
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          progress: newProgress,
          completed: newProgress >= 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
      
      toast.success(`Progrès mis à jour à ${newProgress}%`);
      // Refresh the page to see changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erreur lors de la mise à jour du progrès');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun objectif</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer votre premier objectif !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map(goal => (
        <Card key={goal.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${goal.completed ? 'text-green-600' : ''}`}>
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-muted-foreground mb-3">{goal.description}</p>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={getCategoryColor(goal.category || 'personal')}>
                    {goal.category || 'personnel'}
                  </Badge>
                  {goal.target_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}
                    </div>
                  )}
                </div>
                
                {/* Barre de progression avec boutons +/- */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progrès: {goal.progress}%</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateProgress(goal.id, goal.progress, false)}
                        className="h-6 w-6 p-0"
                        disabled={goal.progress <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateProgress(goal.id, goal.progress, true)}
                        className="h-6 w-6 p-0"
                        disabled={goal.progress >= 100}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={goal.progress} className="w-full" />
                  
                  {/* Marques tous les 10% */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {Array.from({ length: 11 }, (_, i) => (
                      <span key={i} className="text-center">
                        {i * 10}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(goal)}
                  aria-label="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(goal.id)}
                  aria-label="Supprimer"
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
