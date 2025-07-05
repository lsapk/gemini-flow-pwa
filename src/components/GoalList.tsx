
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Edit, Trash2, Target, TrendingUp, Calendar } from "lucide-react";
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
  const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0;

  const handleProgressInputChange = (goalId: string, value: string) => {
    const newProgress = Math.min(100, Math.max(0, parseInt(value) || 0));
    onProgressUpdate(goalId, newProgress);
  };

  const renderGoal = (goal: Goal) => (
    <Card className="hover:shadow-sm transition-shadow border">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className={`font-medium ${goal.completed ? "line-through text-muted-foreground" : ""} text-sm sm:text-base break-words`}>
                {goal.title}
              </h3>
              {goal.completed && (
                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complété
                </Badge>
              )}
            </div>
            
            {goal.description && (
              <p className="text-xs text-muted-foreground mb-2 break-words">
                {goal.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3">
              {goal.category && (
                <Badge className={`${getCategoryColor(goal.category)} text-xs`}>
                  {getCategoryLabel(goal.category)}
                </Badge>
              )}
              {goal.target_date && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">
                    {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}
                  </span>
                  <span className="sm:hidden">
                    {format(new Date(goal.target_date), "dd/MM", { locale: fr })}
                  </span>
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={goal.progress} className="flex-1 h-2" />
                <span className="text-xs font-medium min-w-fit">{goal.progress}%</span>
              </div>
              
              {!goal.completed && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => handleProgressInputChange(goal.id, e.target.value)}
                    className="w-16 h-6 text-xs px-2"
                  />
                  <span className="text-xs text-muted-foreground">% de progression</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal.id)}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
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
              <CardContent className="p-3 sm:p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-3" />
                <div className="h-2 bg-muted rounded" />
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
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
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
            <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
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
          <CardContent className="text-center py-6 sm:py-8 px-3 sm:px-4">
            <Target className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">Aucun objectif</h3>
            <p className="text-sm text-muted-foreground">
              Commencez par créer votre premier objectif !
            </p>
          </CardContent>
        </Card>
      ) : (
        <DraggableGoalList
          goals={goals}
          onRefresh={() => window.location.reload()}
          renderGoal={renderGoal}
        />
      )}
    </div>
  );
}
