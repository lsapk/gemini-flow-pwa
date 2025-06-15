import { Goal } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle2, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";

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

  // Corrigé : collecter les catégories présentes dans les objectifs
  // On utilise un Set pour garantir qu'on ait UNE SEULE fois "other" peu importe combien d'objectifs sans catégorie existent
  const categoriesSet = new Set<string>();
  goals.forEach((g) => categoriesSet.add(g.category || "other"));
  const categories: string[] = Array.from(categoriesSet);

  // Comptage par catégorie
  const goalsByCat: Record<string, Goal[]> = {};
  categories.forEach((cat) => {
    goalsByCat[cat] = goals.filter((g) => (g.category || "other") === cat);
  });

  // Résumé - cards catégorie
  const summaryCards = (
    <div
      className="
        grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3
      "
    >
      {categories.map((cat) => {
        const meta = getCategoryProps(cat);
        const catGoals = goalsByCat[cat];
        const completed = catGoals.filter((g) => g.completed).length;
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
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {completed} terminé{completed > 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Liste détaillée en cards
  return (
    <div className="space-y-6">
      {summaryCards}

      <div className="space-y-3">
        {goals.length === 0 ? (
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
          goals.map((goal) => {
            const catProps = getCategoryProps(goal.category);
            return (
              <Card key={goal.id} className="hover:shadow transition-shadow">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{goal.title}</h3>
                        {goal.completed && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <Badge variant="secondary" className={`${catProps.color} ml-1`}>
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
                        <p className="text-xs text-muted-foreground mt-1">
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
                      <span>{goal.progress || 0}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
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
                        disabled={goal.completed}
                        className="text-xs"
                      >
                        Terminer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
