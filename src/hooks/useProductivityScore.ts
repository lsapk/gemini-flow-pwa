
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProductivityData {
  score: number;
  level: string;
  badges: string[];
  streakBonus: number;
  completionRate: number;
  focusTimeScore: number;
  consistencyScore: number;
  qualityScore: number;
  timeManagementScore: number;
  journalScore: number;
  goalScore: number;
  insights: string[];
  recommendations: string[];
}

export const useProductivityScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['productivity-score', user?.id],
    queryFn: async (): Promise<ProductivityData> => {
      if (!user) {
        return {
          score: 0,
          level: "Débutant",
          badges: [],
          streakBonus: 0,
          completionRate: 0,
          focusTimeScore: 0,
          consistencyScore: 0,
          qualityScore: 0,
          timeManagementScore: 0,
          journalScore: 0,
          goalScore: 0,
          insights: [],
          recommendations: []
        };
      }

      try {
        const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
          body: {
            message: `Analyse en profondeur ces données utilisateur et calcule un score de productivité détaillé avec insights personnalisés. Retourne UNIQUEMENT un objet JSON valide avec les propriétés exactes: 
          {
            "score": nombre_0_à_100,
            "level": "string_français_niveau", 
            "badges": ["array", "de", "badges", "français"],
            "streakBonus": nombre_0_à_20,
            "completionRate": nombre_pourcentage,
            "focusTimeScore": nombre_0_à_25,
            "consistencyScore": nombre_0_à_25,
            "qualityScore": nombre_0_à_25,
            "timeManagementScore": nombre_0_à_25,
            "journalScore": nombre_0_à_15,
            "goalScore": nombre_0_à_15,
            "insights": ["array", "d'analyses", "personnalisées", "courtes"],
            "recommendations": ["array", "de", "recommandations", "actionables"]
          }
          
          ANALYSE APPROFONDIE REQUISE:
          - Patterns dans les habitudes et leur régularité
          - Qualité de la gestion des priorités des tâches
          - Équilibre entre objectifs à court/long terme
          - Efficacité des sessions de focus
          - Évolution temporelle des performances
          - Points forts et axes d'amélioration spécifiques
          - Recommandations concrètes et personnalisées
          `,
            user_id: user.id,
            context: {
              analysis_mode: true
            }
          }
        });

        if (error) throw error;

        // Parser la réponse JSON de l'IA
        let parsedData: ProductivityData;
        try {
          // Essayer de parser directement la réponse
          if (typeof data?.response === 'string') {
            const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
              parsedData = JSON.parse(data.response);
            }
          } else {
            parsedData = data?.response || data;
          }
        } catch (parseError) {
          console.error('Erreur de parsing JSON:', parseError);
          // Fallback avec des valeurs par défaut
          parsedData = {
            score: 50,
            level: "Intermédiaire",
            badges: ["Explorateur Débutant", "Organisateur Novice"],
            streakBonus: 5,
            completionRate: 60,
            focusTimeScore: 10,
            consistencyScore: 15,
            qualityScore: 12,
            timeManagementScore: 8,
            journalScore: 5,
            goalScore: 10,
            insights: ["Continuez vos efforts pour développer votre productivité"],
            recommendations: ["Essayez de compléter plus de tâches chaque jour"]
          };
        }

        // Mise à jour des badges pour enlever ceux liés aux bonnes actions
        const updatedBadges = parsedData.badges.filter(badge => 
          !badge.toLowerCase().includes('bonne action') && 
          !badge.toLowerCase().includes('good action') &&
          !badge.toLowerCase().includes('communaut')
        );

        // Ajouter de nouveaux badges basés sur la productivité
        const newBadges = [];
        if (parsedData.score >= 80) newBadges.push("Maître de la Productivité");
        if (parsedData.score >= 60) newBadges.push("Expert en Organisation");
        if (parsedData.completionRate >= 80) newBadges.push("Finisseur Professionnel");
        if (parsedData.consistencyScore >= 20) newBadges.push("Constance Exemplaire");
        if (parsedData.focusTimeScore >= 20) newBadges.push("Champion de la Concentration");
        if (parsedData.streakBonus >= 15) newBadges.push("Roi des Habitudes");

        return {
          ...parsedData,
          badges: [...updatedBadges, ...newBadges].slice(0, 4) // Limiter à 4 badges
        };

      } catch (error) {
        console.error('Erreur lors du calcul du score de productivité:', error);
        return {
          score: 0,
          level: "Débutant",
          badges: ["Nouveau Défi", "Première Étape"],
          streakBonus: 0,
          completionRate: 0,
          focusTimeScore: 0,
          consistencyScore: 0,
          qualityScore: 0,
          timeManagementScore: 0,
          journalScore: 0,
          goalScore: 0,
          insights: ["Commencez par créer vos premières tâches et habitudes"],
          recommendations: ["Explorez DeepFlow pour améliorer votre productivité"]
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
