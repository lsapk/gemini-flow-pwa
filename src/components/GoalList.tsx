import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Target, Calendar, Archive, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  progress: number;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  is_archived?: boolean;
  sort_order?: number;
}

interface GoalListProps {
  goals: Goal[];
  loading?: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  showArchived?: boolean;
}

export default function GoalList({
  goals,
  loading,
  onEdit,
  onDelete,
  onArchive,
  showArchived = false
}: GoalListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
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
    <div className="grid gap-4 md:gap-6">
      {goals.map((goal) => (
        <Card key={goal.id} className={`hover:shadow-md transition-shadow ${showArchived ? 'opacity-75' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                  {goal.category && (
                    <Badge variant="outline">{goal.category}</Badge>
                  )}
                </div>
                
                {goal.description && (
                  <p className="text-muted-foreground mb-3">{goal.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>Progression: {goal.progress}%</span>
                  </div>
                  
                  {goal.target_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Échéance: {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Progress value={goal.progress} className="w-full h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                    <span>30%</span>
                    <span>40%</span>
                    <span>50%</span>
                    <span>60%</span>
                    <span>70%</span>
                    <span>80%</span>
                    <span>90%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {onArchive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onArchive(goal.id, showArchived)}
                    aria-label={showArchived ? "Restaurer" : "Archiver"}
                    className="h-8 w-8"
                  >
                    {showArchived ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(goal)}
                  aria-label="Modifier"
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(goal.id)}
                  aria-label="Supprimer"
                  className="h-8 w-8"
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
