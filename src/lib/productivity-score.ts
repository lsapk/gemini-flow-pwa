export interface ScoreInput {
  taskCompletionRate: number;
  tasksData: { completed: number; pending: number }[];
  focusData: { minutes: number }[];
  habitsData: { value: number }[];
}
export function localProductivityScore(input: ScoreInput) {
  const clamp = (value: number, max: number) =>
    Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
  const completionRate = clamp(input.taskCompletionRate, 100);
  const minutes = input.focusData.reduce(
    (sum, day) => sum + clamp(day.minutes, 24 * 60),
    0,
  );
  const streak = input.habitsData.reduce(
    (max, habit) => Math.max(max, clamp(habit.value, 3650)),
    0,
  );
  const hasTasks = input.tasksData.some(
    (group) => group.completed + group.pending > 0,
  );
  const hasFocus = minutes > 0;
  const hasHabits = input.habitsData.length > 0;
  const focusTimeScore = hasFocus
    ? Math.round(Math.min(25, (minutes / 420) * 25))
    : 0;
  const consistencyScore = hasHabits
    ? Math.round(Math.min(25, (streak / 7) * 25))
    : 0;
  const taskScore = hasTasks ? (completionRate / 100) * 50 : 0;
  const score = Math.round(taskScore + focusTimeScore + consistencyScore);
  const badges = [];
  if (hasTasks && completionRate >= 80) badges.push("Tâches réalisées");
  if (minutes >= 420) badges.push("7 heures de focus");
  if (streak >= 7) badges.push("Série de 7 jours");
  return {
    score,
    level: score >= 80 ? "Avancé" : score >= 40 ? "Intermédiaire" : "Débutant",
    badges,
    streakBonus: 0,
    completionRate,
    focusTimeScore,
    consistencyScore,
    qualityScore: 0,
    timeManagementScore: 0,
    journalScore: 0,
    goalScore: 0,
    insights: [
      `${Math.round(completionRate)} % des tâches terminées.`,
      `${minutes} minutes de focus sur les sept derniers jours.`,
    ],
    recommendations:
      score === 0
        ? ["Ajoutez une tâche ou une séance de focus pour commencer."]
        : ["Choisissez une prochaine action adaptée à votre disponibilité."],
    calculationMethod:
      "Calcul local : tâches /50, focus sur 7 jours /25 (objectif 420 min), meilleure série d’habitudes /25 (objectif 7 jours). Les autres dimensions ne sont pas évaluées.",
  };
}
