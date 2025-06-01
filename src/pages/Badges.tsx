
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useProductivityScore } from "@/hooks/useProductivityScore";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Target, Calendar, Clock, 
  Award, Crown, Shield, Gem, CheckCircle, TrendingUp,
  BookOpen, Coffee, Brain, Heart, Flame, Medal,
  Sparkles, Rocket, Diamond, Mountain
} from "lucide-react";

interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: any;
  requirement: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'productivity' | 'habits' | 'focus' | 'tasks' | 'journal' | 'streak' | 'special';
  points: number;
}

interface Achievement {
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  date?: string;
}

export default function Badges() {
  const { score, level, badges } = useProductivityScore();
  const { taskCompletionRate, totalFocusTime, streakCount, habitsData } = useAnalyticsData();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'mythic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const allBadges: BadgeInfo[] = [
    // Badges mythiques
    {
      id: 'productivity-god',
      name: 'Dieu de la Productivité',
      description: 'Score parfait de 100 maintenu pendant une semaine',
      icon: Crown,
      requirement: 'Score = 100 (7 jours)',
      earned: score >= 100,
      progress: score,
      maxProgress: 100,
      rarity: 'mythic',
      category: 'special',
      points: 1000
    },
    
    // Badges légendaires
    {
      id: 'productivity-master',
      name: 'Maître Absolu',
      description: 'Atteignez un score de productivité de 95',
      icon: Diamond,
      requirement: 'Score ≥ 95',
      earned: score >= 95,
      progress: score,
      maxProgress: 95,
      rarity: 'legendary',
      category: 'productivity',
      points: 500
    },
    {
      id: 'streak-immortal',
      name: 'Immortel',
      description: 'Maintenez une série de 100 jours',
      icon: Mountain,
      requirement: 'Série de 100 jours',
      earned: streakCount >= 100,
      progress: streakCount,
      maxProgress: 100,
      rarity: 'legendary',
      category: 'streak',
      points: 750
    },

    // Badges épiques
    {
      id: 'productivity-expert',
      name: 'Expert Productif',
      description: 'Atteignez un score de productivité de 80',
      icon: Trophy,
      requirement: 'Score ≥ 80',
      earned: score >= 80,
      progress: score,
      maxProgress: 80,
      rarity: 'epic',
      category: 'productivity',
      points: 300
    },
    {
      id: 'focus-zen',
      name: 'Maître Zen',
      description: 'Accumulez 500 minutes de focus',
      icon: Brain,
      requirement: '500 minutes de focus',
      earned: totalFocusTime >= 500,
      progress: totalFocusTime,
      maxProgress: 500,
      rarity: 'epic',
      category: 'focus',
      points: 400
    },
    {
      id: 'perfectionist-supreme',
      name: 'Perfectionniste Suprême',
      description: 'Complétez 98% de vos tâches',
      icon: Gem,
      requirement: 'Taux de complétion ≥ 98%',
      earned: taskCompletionRate >= 98,
      progress: taskCompletionRate,
      maxProgress: 98,
      rarity: 'epic',
      category: 'tasks',
      points: 350
    },

    // Badges rares
    {
      id: 'productivity-advanced',
      name: 'Productif Avancé',
      description: 'Atteignez un score de productivité de 60',
      icon: Star,
      requirement: 'Score ≥ 60',
      earned: score >= 60,
      progress: score,
      maxProgress: 60,
      rarity: 'rare',
      category: 'productivity',
      points: 150
    },
    {
      id: 'task-master',
      name: 'Maître des Tâches',
      description: 'Complétez 85% de vos tâches',
      icon: CheckCircle,
      requirement: 'Taux de complétion ≥ 85%',
      earned: taskCompletionRate >= 85,
      progress: taskCompletionRate,
      maxProgress: 85,
      rarity: 'rare',
      category: 'tasks',
      points: 200
    },
    {
      id: 'focus-champion',
      name: 'Champion du Focus',
      description: 'Accumulez 200 minutes de focus',
      icon: Zap,
      requirement: '200 minutes de focus',
      earned: totalFocusTime >= 200,
      progress: totalFocusTime,
      maxProgress: 200,
      rarity: 'rare',
      category: 'focus',
      points: 180
    },
    {
      id: 'streak-warrior',
      name: 'Guerrier de la Série',
      description: 'Maintenez une série de 30 jours',
      icon: Flame,
      requirement: 'Série de 30 jours',
      earned: streakCount >= 30,
      progress: streakCount,
      maxProgress: 30,
      rarity: 'rare',
      category: 'streak',
      points: 250
    },

    // Badges communs
    {
      id: 'productivity-starter',
      name: 'Productif Débutant',
      description: 'Atteignez un score de productivité de 30',
      icon: Rocket,
      requirement: 'Score ≥ 30',
      earned: score >= 30,
      progress: score,
      maxProgress: 30,
      rarity: 'common',
      category: 'productivity',
      points: 50
    },
    {
      id: 'first-week',
      name: 'Première Semaine',
      description: 'Maintenez une série de 7 jours',
      icon: Calendar,
      requirement: 'Série de 7 jours',
      earned: streakCount >= 7,
      progress: streakCount,
      maxProgress: 7,
      rarity: 'common',
      category: 'streak',
      points: 75
    },
    {
      id: 'focus-beginner',
      name: 'Focus Débutant',
      description: 'Accumulez 60 minutes de focus',
      icon: Clock,
      requirement: '60 minutes de focus',
      earned: totalFocusTime >= 60,
      progress: totalFocusTime,
      maxProgress: 60,
      rarity: 'common',
      category: 'focus',
      points: 60
    }
  ];

  const earnedBadges = allBadges.filter(badge => badge.earned);
  const totalPoints = earnedBadges.reduce((sum, badge) => sum + badge.points, 0);
  const categories = ['productivity', 'tasks', 'focus', 'streak', 'habits', 'journal', 'special'];

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'productivity': return 'Productivité';
      case 'tasks': return 'Tâches';
      case 'focus': return 'Concentration';
      case 'streak': return 'Séries';
      case 'habits': return 'Habitudes';
      case 'journal': return 'Journal';
      case 'special': return 'Spéciaux';
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return TrendingUp;
      case 'tasks': return CheckCircle;
      case 'focus': return Brain;
      case 'streak': return Flame;
      case 'habits': return Target;
      case 'journal': return BookOpen;
      case 'special': return Sparkles;
      default: return Star;
    }
  };

  const achievements: Achievement[] = [
    {
      title: "Premier pas",
      description: "Première connexion à DeepFlow",
      icon: Star,
      unlocked: true,
      date: "Il y a 5 jours"
    },
    {
      title: "Série de feu",
      description: "7 jours consécutifs d'activité",
      icon: Flame,
      unlocked: streakCount >= 7,
      date: streakCount >= 7 ? "Aujourd'hui" : undefined
    },
    {
      title: "Maître du focus",
      description: "100 minutes de concentration en une journée",
      icon: Brain,
      unlocked: false
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Badges & Récompenses
        </h1>
        <p className="text-muted-foreground">
          Débloquez des badges et gagnez des points en améliorant votre productivité
        </p>
      </motion.div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{earnedBadges.length}</p>
                  <p className="text-xs text-yellow-600">Badges obtenus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">{totalPoints}</p>
                  <p className="text-xs text-purple-600">Points gagnés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{level}</p>
                  <p className="text-xs text-green-600">Niveau actuel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-700">{streakCount}</p>
                  <p className="text-xs text-red-600">Jours de série</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements récents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <achievement.icon 
                    className={`h-6 w-6 ${
                      achievement.unlocked ? 'text-green-600' : 'text-gray-400'
                    }`} 
                  />
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  {achievement.date && (
                    <Badge variant="outline" className="text-xs">
                      {achievement.date}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badges par catégorie */}
      {categories.map((category, categoryIndex) => {
        const categoryBadges = allBadges.filter(badge => badge.category === category);
        if (categoryBadges.length === 0) return null;
        
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + categoryIndex * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CategoryIcon className="h-5 w-5" />
                  {getCategoryName(category)}
                </CardTitle>
                <CardDescription>
                  {categoryBadges.filter(b => b.earned).length} / {categoryBadges.length} badges obtenus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBadges.map((badge, badgeIndex) => {
                    const IconComponent = badge.icon;
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: badgeIndex * 0.05 }}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                          badge.earned 
                            ? 'bg-primary/5 border-primary/20 shadow-md' 
                            : 'bg-muted/50 border-muted opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <IconComponent 
                            className={`h-8 w-8 ${
                              badge.earned ? 'text-primary' : 'text-muted-foreground'
                            }`} 
                          />
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant="outline" 
                              className={getRarityColor(badge.rarity)}
                            >
                              {badge.rarity}
                            </Badge>
                            {badge.earned && (
                              <Badge variant="secondary" className="text-xs">
                                +{badge.points}pts
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold mb-1">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                        <p className="text-xs text-muted-foreground mb-2">{badge.requirement}</p>
                        
                        {badge.maxProgress && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{Math.min(badge.progress || 0, badge.maxProgress)}</span>
                              <span>{badge.maxProgress}</span>
                            </div>
                            <Progress 
                              value={Math.min(((badge.progress || 0) / badge.maxProgress) * 100, 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Call to action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1 }}
        className="text-center py-8"
      >
        <h3 className="text-xl font-semibold mb-2">Continuez votre progression !</h3>
        <p className="text-muted-foreground mb-4">
          Complétez vos tâches, maintenez vos habitudes et concentrez-vous pour débloquer plus de badges.
        </p>
        <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Target className="h-4 w-4 mr-2" />
          Voir mes objectifs
        </Button>
      </motion.div>
    </div>
  );
}
