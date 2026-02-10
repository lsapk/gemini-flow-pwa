
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
  RefreshCw,
  Sparkles,
  Activity,
  Smile,
  Compass,
  Award
} from "lucide-react";
import { PersonalityProfile } from "@/hooks/usePersonalityProfile";
import { motion } from "framer-motion";

interface PersonalityProfileCardProps {
  profile: PersonalityProfile;
  onRefresh: () => void;
  isLoading: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function PersonalityProfileCard({ 
  profile, 
  onRefresh, 
  isLoading 
}: PersonalityProfileCardProps) {
  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Profil de Personnalité IA</h2>
            <p className="text-muted-foreground">Basé sur vos patterns d'activité et vos réflexions</p>
          </div>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          className="rounded-xl h-11 px-6 border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Mettre à jour l'analyse
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Personnalité & Traits */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="h-full border-none shadow-md bg-gradient-to-br from-card to-background hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Heart className="h-5 w-5 text-rose-500" />
                Personnalité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Traits dominants</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.personality.traits.map((trait, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-600 border-none">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Forces majeures</h4>
                <div className="space-y-2">
                  {profile.personality.strengths.map((strength, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Style de travail</h4>
                <p className="text-sm leading-relaxed italic text-muted-foreground">
                  "{profile.personality.working_style}"
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Insights Psychologiques */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="h-full border-none shadow-md bg-gradient-to-br from-card to-background hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Activity className="h-5 w-5 text-indigo-500" />
                Insights Profonds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Patterns comportementaux</h4>
                <div className="space-y-3">
                  {profile.psychological_insights.behavioral_patterns.map((pattern, i) => (
                    <div key={i} className="bg-muted/50 p-3 rounded-xl text-sm border border-border/50">
                      {pattern}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Gestion du stress</h4>
                <div className="flex items-start gap-2 text-sm bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                  <Shield className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p>{profile.psychological_insights.stress_management}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Productivité & Performance */}
        <motion.div variants={item} className="md:col-span-2 lg:col-span-1">
          <Card className="h-full border-none shadow-md bg-gradient-to-br from-card to-background hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Zap className="h-5 w-5 text-amber-500" />
                Analyse de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pics de concentration</h4>
                <div className="grid grid-cols-1 gap-2">
                  {profile.productivity_analysis.peak_performance_times.map((time, i) => (
                    <div key={i} className="flex items-center gap-3 bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      {time}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Freins à la productivité</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.productivity_analysis.productivity_blockers.map((blocker, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1 rounded-lg border-orange-200 bg-orange-50 text-orange-700">
                      {blocker}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Environnement idéal</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Compass className="h-4 w-4 text-primary" />
                  <span>{profile.productivity_analysis.optimal_work_environment}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommandations Stratégiques */}
        <motion.div variants={item} className="md:col-span-2 lg:col-span-2">
          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-indigo-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Lightbulb className="h-5 w-5 text-primary" />
                Recommandations Stratégiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" />
                    Habitudes à forger
                  </h4>
                  <ul className="space-y-2">
                    {profile.recommendations.habits_to_develop.map((habit, i) => (
                      <li key={i} className="flex items-start gap-3 bg-background/60 p-3 rounded-xl border text-sm shadow-sm">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        {habit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Award className="h-3.5 w-3.5" />
                    Optimisation de croissance
                  </h4>
                  <div className="space-y-3">
                    {profile.recommendations.productivity_tips.slice(0, 3).map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <Smile className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trajectoire de croissance */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="h-full border-none shadow-md bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-1/4 -translate-y-1/4">
              <TrendingUp className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="h-5 w-5" />
                Trajectoire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-2">Phase actuelle</h4>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                  <span className="text-lg font-bold">{profile.growth_trajectory.current_phase}</span>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-3">Prochains jalons</h4>
                <div className="space-y-2">
                  {profile.growth_trajectory.next_milestones.map((milestone, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-white/5 p-2 rounded-lg border border-white/10">
                      <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      {milestone}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-2">Potentiel long terme</h4>
                <p className="text-xs leading-relaxed opacity-90 italic font-medium">
                  {profile.growth_trajectory.long_term_potential}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
