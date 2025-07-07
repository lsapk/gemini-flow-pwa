
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit, Trash2, Target, TrendingUp, Calendar, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Goal } from "@/types";
import DraggableGoalList from "./DraggableGoalList";

interface GoalListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onProgressUpdate: (goalId: string, newProgress: number) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'personal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'professional': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'health': return 'bg-green-100 text-green-800 border-green-200';
    case 'financial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'education': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'personal': return 'Personnel';
    case 'professional': return 'Professionnel';
    case 'health': return 'Santé';
    case 'financial': return 'Financier';
    case 'education': return 'Éducation';
    default: return category;
  }
};

export default function GoalList({ goals, loading, onEdit, onDelete, onProgressUpdate }: GoalListProps) {
  const completedGoals = goals.filter(g => g.completed).length;
  const inProgressGoals = goals.filter(g => !g.completed && g.progress > 0).length;
  const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0;

  const handleProgressChange = (goalId: string, increment: boolean) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const newProgress = increment 
      ? Math.min(100, goal.progress + 10)
      : Math.max(0, goal.progress - 10);
    
    onProgressUpdate(goalId, newProgress);
  };

  const renderGoal = (goal: Goal) => (
    <Card className="hover:shadow-sm transition-shadow border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <h3 className={`font-medium text-base sm:text-lg ${goal.completed ? "line-through text-muted-foreground" : ""} break-words`}>
                {goal.title}
              </h3>
              {goal.completed && (
                <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complété
                </Badge>
              )}
            </div>
            
            {goal.description && (
              <p className="text-sm text-muted-foreground mb-3 break-words">
                {goal.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {goal.category && (
                <Badge className={`${getCategoryColor(goal.category)} text-sm`}>
                  {getCategoryLabel(goal.category)}
                </Badge>
              )}
              {goal.target_date && (
                <Badge variant="outline" className="text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={goal.progress} className="flex-1 h-3" />
                <span className="text-sm font-medium min-w-fit text-base">{goal.progress}%</span>
              </div>
              
              {!goal.completed && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProgressChange(goal.id, false)}
                    disabled={goal.progress <= 0}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">Progression</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProgressChange(goal.id, true)}
                    disabled={goal.progress >= 100}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-5 bg-muted rounded mb-3" />
                <div className="h-4 bg-muted rounded w-2/3 mb-4" />
                <div className="h-3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cartes résumé */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectifs complétés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              sur {goals.length} objectif{goals.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressGoals}</div>
            <p className="text-xs text-muted-foreground">
              objectif{inProgressGoals > 1 ? 's' : ''} en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgProgress)}%</div>
            <div className="mt-2">
              <Progress value={avgProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des objectifs */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 px-4">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun objectif</h3>
            <p className="text-sm text-muted-foreground">
              Commencez par créer votre premier objectif !
            </p>
          </CardContent>
        </Card>
      ) : (
        <DraggableGoalList
          goals={goals}
          onReorder={() => {}}
          onToggle={() => {}}
          onDelete={onDelete}
          onProgressUpdate={onProgressUpdate}
          showArchived={false}
          renderGoal={renderGoal}
        />
      )}
    </div>
  );
}
