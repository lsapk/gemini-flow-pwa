
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Goal } from "@/types";
import { Edit, Trash2, CheckCircle2, Calendar, Target } from "lucide-react";

interface GoalListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onProgressUpdate: (goalId: string, newProgress: number) => void;
}

const categories = [
  { value: "personal", label: "Personnel" },
  { value: "professional", label: "Professionnel" },
  { value: "health", label: "Santé" },
  { value: "financial", label: "Financier" },
  { value: "education", label: "Éducation" },
];

export default function GoalList({
  goals,
  loading,
  onEdit,
  onDelete,
  onProgressUpdate,
}: GoalListProps) {
  // Compte le nombre d'objectifs par catégorie
  const countByCategory = (cat: string) =>
    goals.filter((g) => g.category === cat).length;

  // Liste des objectifs sans catégorie
  const otherGoals = goals.filter((g) => !g.category || !categories.find(c => c.value === g.category));
  const mainGoals = goals.filter((g) => g.category && categories.find(c => c.value === g.category));

  // Résumé en cartes, une par catégorie + éventuellement "Autres"
  return (
    <div className="space-y-6">
      {/* Résumé par catégorie */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <Card key={cat.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{cat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countByCategory(cat.value)}</div>
              <p className="text-xs text-muted-foreground">objectifs</p>
            </CardContent>
          </Card>
        ))}
        {/* Afficher une seule carte "Autre" si besoin */}
        {otherGoals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Autres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{otherGoals.length}</div>
              <p className="text-xs text-muted-foreground">objectifs</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Liste des objectifs */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement…</div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <div className="text-lg font-semibold mb-1">Aucun objectif</div>
              <div className="text-sm text-muted-foreground">Ajoutez votre premier objectif pour commencer !</div>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="transition hover:shadow-md">
              <CardHeader className="pb-2 flex flex-row justify-between items-center gap-2">
                <div>
                  <CardTitle className="text-base font-bold">{goal.title}</CardTitle>
                  {goal.category ? (
                    <Badge className="mt-1">{categories.find(c => c.value === goal.category)?.label || goal.category}</Badge>
                  ) : (
                    <Badge className="mt-1" variant="secondary">Autres</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label="Modifier"
                    className="rounded p-1 hover:bg-muted"
                    onClick={() => onEdit(goal)}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Supprimer"
                    className="rounded p-1 hover:bg-muted"
                    onClick={() => onDelete(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 pb-4">
                {goal.description && <div className="text-sm mb-1">{goal.description}</div>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {goal.target_date && (
                    <>
                      <Calendar className="h-4 w-4" />
                      <span>Échéance : {goal.target_date.split("T")[0]}</span>
                    </>
                  )}
                  <span className={`ml-auto flex items-center gap-1 ${goal.completed ? "text-green-600 font-semibold" : ""}`}>
                    {goal.completed && <CheckCircle2 className="h-4 w-4" />}
                    {goal.completed ? "Terminé" : `Progrès : ${goal.progress}%`}
                  </span>
                </div>
                {!goal.completed && (
                  <Progress
                    value={goal.progress}
                    className="h-2 mt-2"
                    onClick={() => {
                      // Optionnel: interaction pour mise à jour rapide ?
                    }}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
