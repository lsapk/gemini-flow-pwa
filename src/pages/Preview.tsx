import { DashboardView } from "./Dashboard";
import { parisDateKey } from "@/lib/task-planning";
export default function Preview() {
  const today = parisDateKey(new Date());
  return (
    <DashboardView
      preview
      name="Camille"
      data={{
        habitCount: 3,
        focusMinutes: 215,
        week: [25, 50, 0, 40, 25, 50, 25],
        tasks: [
          {
            id: "preview-1",
            title: "Revoir le chapitre de statistiques",
            due_date: today,
            priority: "high",
            completed: false,
          },
          {
            id: "preview-2",
            title: "Préparer le plan du mémoire",
            due_date: today,
            priority: "medium",
            completed: false,
          },
          {
            id: "preview-3",
            title: "Réserver une salle de travail à la BU",
            due_date: today,
            priority: "low",
            completed: false,
          },
          {
            id: "preview-4",
            title: "Relire les notes du dernier cours",
            due_date: today,
            priority: "low",
            completed: true,
          },
        ],
      }}
    />
  );
}
