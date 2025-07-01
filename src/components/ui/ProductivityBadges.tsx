
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Zap, 
  Trophy, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Brain,
  Star,
  Flame,
  Award
} from "lucide-react";

interface ProductivityBadgesProps {
  habitsCount: number;
  tasksCompleted: number;
  goalsProgress: number;
  focusTime: number;
  streakDays: number;
}

export default function ProductivityBadges({ 
  habitsCount, 
  tasksCompleted, 
  goalsProgress, 
  focusTime,
  streakDays 
}: ProductivityBadgesProps) {
  const badges = [
    {
      id: 'habit-builder',
      name: 'Constructeur d\'habitudes',
      description: 'Créé 5+ habitudes',
      icon: Target,
      unlocked: habitsCount >= 5,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'task-master',
      name: 'Maître des tâches',
      description: 'Complété 20+ tâches',
      icon: CheckCircle,
      unlocked: tasksCompleted >= 20,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'goal-achiever',
      name: 'Atteigneur d\'objectifs',
      description: 'Progression moyenne >75%',
      icon: Trophy,
      unlocked: goalsProgress >= 75,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'focus-champion',
      name: 'Champion de focus',
      description: '10+ heures de focus',
      icon: Brain,
      unlocked: focusTime >= 600, // 10 heures en minutes
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'streak-warrior',
      name: 'Guerrier des séries',
      description: '7+ jours de série',
      icon: Flame,
      unlocked: streakDays >= 7,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'productive-week',
      name: 'Semaine productive',
      description: 'Actif 5+ jours cette semaine',
      icon: Calendar,
      unlocked: streakDays >= 5,
      color: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'efficiency-expert',
      name: 'Expert en efficacité',
      description: 'Score de productivité >80',
      icon: Zap,
      unlocked: false, // Sera calculé dynamiquement
      color: 'bg-cyan-100 text-cyan-800'
    },
    {
      id: 'consistency-king',
      name: 'Roi de la régularité',
      description: '30+ jours de série',
      icon: Star,
      unlocked: streakDays >= 30,
      color: 'bg-pink-100 text-pink-800'
    }
  ];

  const unlockedBadges = badges.filter(badge => badge.unlocked);
  const lockedBadges = badges.filter(badge => !badge.unlocked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />
          Badges de productivité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {unlockedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2">
                Débloqués ({unlockedBadges.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unlockedBadges.map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <div key={badge.id} className={`p-3 rounded-lg border ${badge.color}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium text-sm">{badge.name}</span>
                      </div>
                      <p className="text-xs opacity-80">{badge.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {lockedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                À débloquer ({lockedBadges.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lockedBadges.slice(0, 4).map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <div key={badge.id} className="p-3 rounded-lg border bg-muted/30 opacity-60">
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium text-sm">{badge.name}</span>
                      </div>
                      <p className="text-xs">{badge.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
