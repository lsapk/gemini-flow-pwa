import { z } from "zod";

const shortText = z.string().trim().min(1).max(1200);
const list = z.array(shortText).max(8);
export const insightSchema = z
  .array(
    z.object({
      id: z.string().max(100),
      title: shortText,
      insight: shortText,
      recommendation: shortText,
      priority: z.enum(["high", "medium", "low"]),
      category: z
        .enum(["performance", "habits", "focus", "motivation", "optimization"])
        .optional(),
      metric: z.string().max(100).optional(),
    }),
  )
  .min(1)
  .max(8);
export type AIInsight = z.infer<typeof insightSchema>[number];
export const personalitySchema = z.object({
  personality: z.object({
    traits: list,
    strengths: list,
    areas_to_improve: list,
    motivations: list,
    working_style: shortText,
  }),
  psychological_insights: z.object({
    behavioral_patterns: list,
    stress_management: shortText,
    decision_making_style: shortText,
    social_preferences: shortText,
  }),
  productivity_analysis: z.object({
    peak_performance_times: list,
    productivity_blockers: list,
    optimal_work_environment: shortText,
    goal_achievement_style: shortText,
  }),
  recommendations: z.object({
    habits_to_develop: list,
    productivity_tips: list,
    personal_growth: list,
    stress_management: list,
  }),
  growth_trajectory: z.object({
    current_phase: shortText,
    next_milestones: list,
    long_term_potential: shortText,
  }),
});
export type PersonalityProfile = z.infer<typeof personalitySchema>;

export function parseAIJson<T>(response: unknown, schema: z.ZodType<T>): T {
  if (typeof response !== "string" || response.length > 40000)
    throw new Error(
      "La réponse IA est invalide. Aucun résultat n’a été enregistré.",
    );
  const fenced = response.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  let value: unknown;
  try {
    value = JSON.parse(fenced ? fenced[1] : response);
  } catch {
    throw new Error(
      "La réponse IA n’est pas un JSON valide. Réessayez avec une demande plus courte.",
    );
  }
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "La réponse IA est incomplète ou invalide. Aucun résultat n’a été enregistré.",
    );
  return result.data;
}
