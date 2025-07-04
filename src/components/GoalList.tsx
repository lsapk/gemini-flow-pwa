
import { Goal } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle2, Calendar, Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useState } from "react";

interface GoalListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onProgressUpdate: (id: string, newProgress: number) => void;
}

const categoryMeta = {
  personal: { label: "Personnel", color: "bg-purple-100 text-purple-800", emoji: "🎯" },
  professional: { label: "Professionnel", color: "bg-blue-100 text-blue-800", emoji: "💼" },
  health: { label: "Santé", color: "bg-green-100 text-green-800", emoji: "🩺" },
  financial: { label: "Financier", color: "bg-yellow-100 text-yellow-800", emoji: "💰" },
  education: { label: "Éducation", color: "bg-pink-100 text-pink-800", emoji: "📚" },
  other: { label: "Autre", color: "bg-orange-100 text-orange-800", emoji: "📝" }
} as const;

function getCategoryProps(category: string | undefined) {
  switch (category) {
    case "personal":
    case "professional":
    case "health":
    case "financial":
    case "education":
      return categoryMeta[category];
    default:
      return categoryMeta.other;
  }
}

export default function GoalList({
  goals,
  loading,
  onEdit,
  onDelete,
  onProgressUpdate,
}: GoalListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Séparer les objectifs terminés et en cours
  const completedGoals = goals.filter(g => g.completed);
  const activeGoals = goals.filter(g => !g.completed);

  // Collecte des catégories uniques pour les objectifs actifs
  const categoriesMap = new Map<string, boolean>();
  activeGoals.forEach((g) => {
    let cat = typeof g.category === "string" && g.category.trim() ? g.category.trim() : "other";
    if (!categoryMeta.hasOwnProperty(cat)) {
      cat = "other";
    }
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, true);
  });
  const categories: string[] = Array.from(categoriesMap.keys());

  // Comptage par catégorie (objectifs actifs seulement)
  const goalsByCat: Record<string, Goal[]> = {};
  categories.forEach((cat) => {
    goalsByCat[cat] = activeGoals.filter((g) => {
      let gc = typeof g.category === "string" && g.category.trim() ? g.category.trim() : "other";
      if (!categoryMeta.hasOwnProperty(gc)) {
        gc = "other";
      }
      return gc === cat;
    });
  });

  // Résumé - cards catégorie (seulement pour les objectifs actifs)
  const summaryCards = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3">
      {categories.map((cat) => {
        const meta = getCategoryProps(cat);
        const catGoals = goalsByCat[cat];
        return (
          <Card key={cat} className="flex px-2 py-2 sm:p-4 items-center transition-shadow">
            <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${meta.color}`}>
                <span className="text-xl sm:text-2xl">{meta.emoji}</span>
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <div className="font-semibold text-xs sm:text-base">{meta.label}</div>
                <div className="text-[11px] sm:text-sm text-muted-foreground">
                  {catGoals.length} objectif{catGoals.length > 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderGoal = (goal: Goal, isCompleted = false) => {
    const catProps = getCategoryProps(goal.category);
    return (
      <Card 
        key={goal.id} 
        className={`
          hover:shadow transition-shadow
          ${isCompleted ? 'bg-green-50 border-green-200' : ''}
        `}
      >
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-base ${isCompleted ? 'text-green-800' : ''}`}>
                  {goal.title}
                </h3>
                {goal.completed && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <Badge 
                  variant="secondary" 
                  className={`${isCompleted ? 'bg-green-200 text-green-800' : catProps.color} ml-1`}
                >
                  {catProps.label}
                </Badge>
                {goal.target_date && (
                  <Badge variant="outline" className="ml-1">
                    <Calendar className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
                    {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}
                  </Badge>
                )}
              </div>
              {goal.description && (
                <p className={`text-xs mt-1 ${isCompleted ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {goal.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(goal)}
                className="h-7 w-7"
                aria-label="Modifier"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(goal.id)}
                className="h-7 w-7"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress section */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span>Progrès</span>
              <span className={isCompleted ? 'text-green-700 font-semibold' : ''}>
                {goal.progress || 0}%
              </span>
            </div>
            <Progress 
              value={goal.progress} 
              className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`} 
            />
            {!isCompleted && (
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onProgressUpdate(goal.id, Math.max(0, (goal.progress ?? 0) - 10))
                  }
                  className="text-xs"
                >
                  -10%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onProgressUpdate(goal.id, Math.min(100, (goal.progress ?? 0) + 10))
                  }
                  className="text-xs"
                >
                  +10%
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onProgressUpdate(goal.id, 100)}
                  className="text-xs"
                >
                  Terminer
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {summaryCards}

      <div className="space-y-3">
        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">Aucun objectif défini</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier objectif
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Objectifs en cours */}
            {activeGoals.map(goal => renderGoal(goal, false))}
            
            {/* Section des objectifs terminés */}
            {completedGoals.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2"
                  >
                    {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showCompleted ? 'Masquer' : 'Voir'} les objectifs terminés ({completedGoals.length})
                  </Button>
                </div>
                
                {showCompleted && (
                  <div className="space-y-3">
                    {completedGoals.map(goal => renderGoal(goal, true))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
