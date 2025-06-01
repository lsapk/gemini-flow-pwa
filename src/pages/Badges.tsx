
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProductivityScore } from "@/hooks/useProductivityScore";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Target, Calendar, Clock, 
  Award, Crown, Shield, Gem, CheckCircle, TrendingUp,
  BookOpen, Coffee, Brain, Heart, Flame, Medal
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
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'productivity' | 'habits' | 'focus' | 'tasks' | 'journal' | 'streak';
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
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const allBadges: BadgeInfo[] = [
    // Badges de productivité
    {
      id: 'productivity-novice',
      name: 'Novice Productif',
      description: 'Atteignez un score de productivité de 40',
      icon: Star,
      requirement: 'Score ≥ 40',
      earned: score >= 40,
      progress: score,
      maxProgress: 40,
      rarity: 'common',
      category: 'productivity'
    },
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
      category: 'productivity'
    },
    {
      id: 'productivity-master',
      name: 'Maître de la Productivité',
      description: 'Atteignez un score parfait de 100',
      icon: Crown,
      requirement: 'Score = 100',
      earned: score >= 100,
      progress: score,
      maxProgress: 100,
      rarity: 'legendary',
      category: 'productivity'
    },

    // Badges de tâches
    {
      id: 'task-completer',
      name: 'Finisseur',
      description: 'Complétez 80% de vos tâches',
      icon: CheckCircle,
      requirement: 'Taux de complétion ≥ 80%',
      earned: taskCompletionRate >= 80,
      progress: taskCompletionRate,
      maxProgress: 80,
      rarity: 'rare',
      category: 'tasks'
    },
    {
      id: 'task-perfectionist',
      name: 'Perfectionniste',
      description: 'Complétez 95% de vos tâches',
      icon: Gem,
      requirement: 'Taux de complétion ≥ 95%',
      earned: taskCompletionRate >= 95,
      progress: taskCompletionRate,
      maxProgress: 95,
      rarity: 'epic',
      category: 'tasks'
    },

    // Badges de focus
    {
      id: 'focus-starter',
      name: 'Concentration Débutant',
      description: 'Accumulez 60 minutes de focus',
      icon: Clock,
      requirement: '60 minutes de focus',
      earned: totalFocusTime >= 60,
      progress: totalFocusTime,
      maxProgress: 60,
      rarity: 'common',
      category: 'focus'
    },
    {
      id: 'focus-master',
      name: 'Maître de la Concentration',
      description: 'Accumulez 300 minutes de focus',
      icon: Brain,
      requirement: '300 minutes de focus',
      earned: totalFocusTime >= 300,
      progress: totalFocusTime,
      maxProgress: 300,
      rarity: 'epic',
      category: 'focus'
    },

    // Badges de série
    {
      id: 'streak-week',
      name: 'Semaine Parfaite',
      description: 'Maintenez une série de 7 jours',
      icon: Calendar,
      requirement: 'Série de 7 jours',
      earned: streakCount >= 7,
      progress: streakCount,
      maxProgress: 7,
      rarity: 'rare',
      category: 'streak'
    },
    {
      id: 'streak-month',
      name: 'Mois Déterminé',
      description: 'Maintenez une série de 30 jours',
      icon: Flame,
      requirement: 'Série de 30 jours',
      earned: streakCount >= 30,
      progress: streakCount,
      maxProgress: 30,
      rarity: 'legendary',
      category: 'streak'
    },

    // Badges d'habitudes
    {
      id: 'habit-builder',
      name: 'Constructeur d\'Habitudes',
      description: 'Créez 3 habitudes',
      icon: Target,
      requirement: '3 habitudes actives',
      earned: habitsData.length >= 3,
      progress: habitsData.length,
      maxProgress: 3,
      rarity: 'common',
      category: 'habits'
    },
    {
      id: 'habit-master',
      name: 'Maître des Habitudes',
      description: 'Maintenez 5 habitudes avec une série moyenne de 7 jours',
      icon: Medal,
      requirement: '5 habitudes, série moy. 7j',
      earned: habitsData.length >= 5 && habitsData.reduce((sum, h) => sum + h.value, 0) / habitsData.length >= 7,
      progress: habitsData.length >= 5 ? habitsData.reduce((sum, h) => sum + h.value, 0) / habitsData.length : 0,
      maxProgress: 7,
      rarity: 'epic',
      category: 'habits'
    }
  ];

  const earnedBadges = allBadges.filter(badge => badge.earned);
  const categories = ['productivity', 'tasks', 'focus', 'streak', 'habits', 'journal'];

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'productivity': return 'Productivité';
      case 'tasks': return 'Tâches';
      case 'focus': return 'Concentration';
      case 'streak': return 'Séries';
      case 'habits': return 'Habitudes';
      case 'journal': return 'Journal';
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
      default: return Star;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Badges & Récompenses</h1>
        <p className="text-muted-foreground">
          Débloquez des badges en améliorant votre productivité
        </p>
      </motion.div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{earnedBadges.length}</p>
                  <p className="text-xs text-muted-foreground">Badges obtenus</p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{score}</p>
                  <p className="text-xs text-muted-foreground">Score productivité</p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{level}</p>
                  <p className="text-xs text-muted-foreground">Niveau actuel</p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{streakCount}</p>
                  <p className="text-xs text-muted-foreground">Jours de série</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Badges par catégorie */}
      {categories.map((category, categoryIndex) => {
        const categoryBadges = allBadges.filter(badge => badge.category === category);
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + categoryIndex * 0.1 }}
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
                        className={`p-4 rounded-lg border-2 transition-all ${
                          badge.earned 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-muted/50 border-muted opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <IconComponent 
                            className={`h-8 w-8 ${
                              badge.earned ? 'text-primary' : 'text-muted-foreground'
                            }`} 
                          />
                          <Badge 
                            variant="outline" 
                            className={getRarityColor(badge.rarity)}
                          >
                            {badge.rarity}
                          </Badge>
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
    </div>
  );
}
