
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Target, Calendar, CheckCircle, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Goal } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface GoalListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  showCompleted?: boolean;
  onDragStart?: (e: React.DragEvent, id: string, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
}

export default function GoalList({ 
  goals, 
  loading, 
  onEdit, 
  onDelete, 
  showCompleted = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: GoalListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredGoals = showCompleted ? goals.filter(g => g.completed) : goals.filter(g => !g.completed);

  if (filteredGoals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {showCompleted ? "Aucun objectif terminé" : "Aucun objectif en cours"}
          </h3>
          <p className="text-muted-foreground text-center">
            {showCompleted 
              ? "Les objectifs terminés apparaîtront ici."
              : "Commencez par créer votre premier objectif pour atteindre vos rêves !"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredGoals.map((goal, index) => (
        <Card 
          key={goal.id} 
          className={`hover:shadow-md transition-shadow ${
            goal.completed ? 'bg-green-50 border-green-200' : ''
          }`}
          draggable={!goal.completed && onDragStart ? true : false}
          onDragStart={onDragStart && !goal.completed ? (e) => onDragStart(e, goal.id, index) : undefined}
          onDragOver={onDragOver}
          onDrop={onDrop ? (e) => onDrop(e, index) : undefined}
          onDragEnd={onDragEnd}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!goal.completed && onDragStart && (
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className={`text-lg mb-2 ${goal.completed ? 'text-green-800' : ''}`}>
                    <div className="flex items-center gap-2">
                      {goal.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {goal.title}
                    </div>
                  </CardTitle>
                  
                  {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1 ml-2">
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
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progression</span>
                  <span className={`font-medium ${goal.completed ? 'text-green-600' : ''}`}>
                    {goal.progress}%
                  </span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className={`h-2 ${goal.completed ? '[&>div]:bg-green-500' : ''}`}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={goal.completed ? "default" : "secondary"}
                  className={goal.completed ? "bg-green-100 text-green-800" : ""}
                >
                  {goal.category}
                </Badge>
                
                {goal.target_date && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}
                  </Badge>
                )}
                
                {goal.completed && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Terminé
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
