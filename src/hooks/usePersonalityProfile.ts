import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { requestAI } from "@/services/ai";
import {
  parseAIJson,
  personalitySchema,
  type PersonalityProfile,
} from "@/lib/ai-response";
export type { PersonalityProfile } from "@/lib/ai-response";

export const usePersonalityProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [profileOwner, setProfileOwner] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeUser = useRef(user?.id);
  activeUser.current = user?.id;
  const pending = useRef<string | null>(null);
  useEffect(() => {
    setProfile(null);
    setError(null);
    setIsLoading(false);
  }, [user?.id]);
  const generateProfile = async (
    options: { includeJournal?: boolean } = {},
  ) => {
    if (!user || pending.current === user.id) return;
    pending.current = user.id;
    setIsLoading(true);
    setError(null);
    const owner = user.id;
    try {
      const response = await requestAI(
        `Propose des pistes de réflexion sur les habitudes de travail observées dans les données fournies. Ce n'est pas un diagnostic psychologique. N'infère pas de trouble, de trait sensible, de préférence sociale ou de potentiel à long terme à partir de tâches. Indique explicitement "Données insuffisantes" pour ce qui ne peut pas être établi. Maximum 2 phrases courtes par champ, 3 éléments par liste. Retourne UNIQUEMENT ce JSON rempli :
{"personality":{"traits":[],"strengths":[],"areas_to_improve":[],"motivations":[],"working_style":""},"psychological_insights":{"behavioral_patterns":[],"stress_management":"","decision_making_style":"","social_preferences":""},"productivity_analysis":{"peak_performance_times":[],"productivity_blockers":[],"optimal_work_environment":"","goal_achievement_style":""},"recommendations":{"habits_to_develop":[],"productivity_tips":[],"personal_growth":[],"stress_management":[]},"growth_trajectory":{"current_phase":"","next_milestones":[],"long_term_potential":""}}`,
        options.includeJournal === true,
      );
      const value = parseAIJson(response, personalitySchema);
      if (activeUser.current === owner) {
        setProfile(value);
        setProfileOwner(owner);
      }
    } catch (failure) {
      if (activeUser.current === owner)
        setError(
          failure instanceof Error ? failure.message : "L’analyse a échoué.",
        );
    } finally {
      if (pending.current === owner) pending.current = null;
      if (activeUser.current === owner) setIsLoading(false);
    }
  };
  return {
    profile: profileOwner === user?.id ? profile : null,
    isLoading,
    error,
    generateProfile,
  };
};
