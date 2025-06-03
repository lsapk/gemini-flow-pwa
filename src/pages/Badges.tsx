import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

export default function Badges() {
  const [allBadges, setAllBadges] = useState<Badge[]>([
    {
      id: "task_master",
      name: "Maître des Tâches",
      description: "Créez 50 tâches.",
      icon: "📝",
      criteria: "Create 50 tasks",
    },
    {
      id: "habit_builder",
      name: "Bâtisseur d'Habitudes",
      description: "Créez 25 habitudes.",
      icon: "🔄",
      criteria: "Create 25 habits",
    },
    {
      id: "goal_setter",
      name: "Fixeur d'Objectifs",
      description: "Créez 10 objectifs.",
      icon: "🎯",
      criteria: "Create 10 goals",
    },
    {
      id: "journal_keeper",
      name: "Gardien du Journal",
      description: "Écrivez 30 entrées de journal.",
      icon: "📒",
      criteria: "Write 30 journal entries",
    },
    {
      id: "early_bird",
      name: "Lève-Tôt",
      description: "Connectez-vous 7 jours de suite.",
      icon: "☀️",
      criteria: "Login 7 days straight",
    },
    {
      id: "night_owl",
      name: "Oiseau de Nuit",
      description: "Utilisez l'application après minuit 5 fois.",
      icon: "🌙",
      criteria: "Use the app after midnight 5 times",
    },
    {
      id: "social_butterfly",
      name: "Papillon Social",
      description: "Partagez 10 bonnes actions publiques.",
      icon: "📢",
      criteria: "Share 10 public good actions",
    },
    {
      id: "kind_heart",
      name: "Cœur Bienveillant",
      description: "Recevez 20 likes sur vos bonnes actions.",
      icon: "❤️",
      criteria: "Receive 20 likes on good actions",
    },
    {
      id: "productivity_pro",
      name: "Pro de la Productivité",
      description: "Complétez 50 tâches.",
      icon: "✅",
      criteria: "Complete 50 tasks",
    },
    {
      id: "streak_master",
      name: "Maître des Séries",
      description: "Maintenez une série de 30 jours sur une habitude.",
      icon: "🔥",
      criteria: "Maintain a 30-day streak on a habit",
    },
  ]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [karmaPoints, setKarmaPoints] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Simulate fetching user data and calculating badges/karma
    // Replace with actual data fetching from your backend
    if (user) {
      // Example logic (replace with your actual logic)
      const calculateBadges = () => {
        const earned = allBadges.slice(0, Math.floor(Math.random() * allBadges.length));
        setEarnedBadges(earned);
        setKarmaPoints(earned.length * 15);
      };

      calculateBadges();
    }
  }, [user, allBadges]);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Badges & Récompenses</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Vos accomplissements et récompenses
        </p>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl mb-2">🏆</div>
            <p className="text-lg sm:text-xl font-bold text-yellow-900">{earnedBadges.length}</p>
            <p className="text-xs sm:text-sm text-yellow-700">Badges obtenus</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl mb-2">⭐</div>
            <p className="text-lg sm:text-xl font-bold text-purple-900">{karmaPoints}</p>
            <p className="text-xs sm:text-sm text-purple-700">Points Karma</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl mb-2">🎯</div>
            <p className="text-lg sm:text-xl font-bold text-blue-900">
              {Math.round((earnedBadges.length / allBadges.length) * 100)}%
            </p>
            <p className="text-xs sm:text-sm text-blue-700">Progression</p>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges - Mobile Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">🏆 Badges obtenus</CardTitle>
        </CardHeader>
        <CardContent>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200"
                >
                  <div className="text-2xl sm:text-3xl">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-yellow-900 truncate">
                      {badge.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-yellow-700 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🎯</div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Aucun badge encore</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Continuez à utiliser DeepFlow pour débloquer vos premiers badges !
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Badges - Mobile Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">🎖️ Tous les badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {allBadges.map((badge) => {
              const isEarned = earnedBadges.some(earned => earned.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                    isEarned
                      ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className={`text-2xl sm:text-3xl ${!isEarned && 'grayscale'}`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${
                      isEarned ? 'text-green-900' : 'text-gray-600'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className={`text-xs sm:text-sm line-clamp-2 ${
                      isEarned ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {badge.description}
                    </p>
                    {isEarned && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">
                          ✓ Obtenu
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
