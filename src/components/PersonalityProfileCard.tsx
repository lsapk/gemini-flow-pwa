
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Heart, 
  Zap, 
  Shield,
  Lightbulb,
  Calendar,
  RefreshCw
} from "lucide-react";
import { PersonalityProfile } from "@/hooks/usePersonalityProfile";

interface PersonalityProfileCardProps {
  profile: PersonalityProfile;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function PersonalityProfileCard({ 
  profile, 
  onRefresh, 
  isLoading 
}: PersonalityProfileCardProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold">Profil de Personnalité</h2>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Personnalité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-red-500" />
              Personnalité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Traits principaux</h4>
              <div className="flex flex-wrap gap-1">
                {profile.personality.traits.map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{trait}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Forces</h4>
              <div className="flex flex-wrap gap-1">
                {profile.personality.strengths.map((strength, i) => (
                  <Badge key={i} variant="default" className="text-xs bg-green-100 text-green-800">{strength}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Style de travail</h4>
              <p className="text-sm text-muted-foreground">{profile.personality.working_style}</p>
            </div>
          </CardContent>
        </Card>

        {/* Insights Psychologiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-500" />
              Insights Psychologiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Patterns comportementaux</h4>
              <ul className="space-y-1">
                {profile.psychological_insights.behavioral_patterns.map((pattern, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0"></span>
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Gestion du stress</h4>
              <p className="text-sm text-muted-foreground">{profile.psychological_insights.stress_management}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Style de décision</h4>
              <p className="text-sm text-muted-foreground">{profile.psychological_insights.decision_making_style}</p>
            </div>
          </CardContent>
        </Card>

        {/* Analyse Productivité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Analyse Productivité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Pics de performance</h4>
              <ul className="space-y-1">
                {profile.productivity_analysis.peak_performance_times.map((time, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {time}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Obstacles</h4>
              <div className="flex flex-wrap gap-1">
                {profile.productivity_analysis.productivity_blockers.map((blocker, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">{blocker}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Environnement optimal</h4>
              <p className="text-sm text-muted-foreground">{profile.productivity_analysis.optimal_work_environment}</p>
            </div>
          </CardContent>
        </Card>

        {/* Recommandations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Habitudes à développer</h4>
              <ul className="space-y-1">
                {profile.recommendations.habits_to_develop.map((habit, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {habit}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Conseils productivité</h4>
              <ul className="space-y-1">
                {profile.recommendations.productivity_tips.slice(0, 3).map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trajectoire de croissance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Trajectoire de Croissance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Phase actuelle</h4>
              <Badge variant="outline" className="w-full justify-center">
                {profile.growth_trajectory.current_phase}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Prochains jalons</h4>
              <ul className="space-y-1">
                {profile.growth_trajectory.next_milestones.map((milestone, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {milestone}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Potentiel long terme</h4>
              <p className="text-sm text-muted-foreground">{profile.growth_trajectory.long_term_potential}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
