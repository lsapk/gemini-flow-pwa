import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeProductivityScore } from "@/hooks/useRealtimeProductivityScore";
import { Link } from "react-router-dom";
import { 
  CheckSquare, 
  Repeat, 
  Timer, 
  BookOpen, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user } = useAuth();
  const productivityData = useRealtimeProductivityScore();
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Aller chercher le nom d'affichage depuis Supabase au montage si user existe
  useEffect(() => {
    async function fetchDisplayName() {
      if (user?.id) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (data?.display_name) {
          setDisplayName(data.display_name);
        }
      }
    }
    fetchDisplayName();
  }, [user]);

  // Message selon le moment de la journée
  const salutation = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return "Bonsoir";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  const quickActions = [
    { name: "Nouvelle tâche", href: "/tasks", icon: CheckSquare, color: "bg-blue-500" },
    { name: "Session focus", href: "/focus", icon: Timer, color: "bg-green-500" },
    { name: "Journal", href: "/journal", icon: BookOpen, color: "bg-purple-500" },
    { name: "Habitudes", href: "/habits", icon: Repeat, color: "bg-orange-500" },
  ];

  // Animation etiquette
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.10,
        duration: 0.5,
        type: "spring",
      }
    }),
  };

  return (
    <div className="container mx-auto px-2 py-6 space-y-8">
      {/* En-tête du tableau de bord */}
      <div className="space-y-1">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Tableau de bord
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {salutation}{" "}
          {user
            ? (
              <span className="font-semibold">
                {/* Affiche le nom d'affichage, sinon fallback email */}
                {displayName ?? user.email}
              </span>
            )
            : ""}
          {" ! Voici votre aperçu de productivité aujourd'hui."}
        </motion.p>
      </div>

      {/* Score de productivité principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.90 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="relative overflow-hidden shadow-md">
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full transform translate-x-16 -translate-y-16"
            initial={{ scale: 0.7, opacity: 0.25 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 0.7 }}
          />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score de productivité
              </span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Temps réel
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex flex-col items-start sm:items-start">
                <motion.div
                  className="text-5xl font-extrabold text-primary mb-2"
                  key={productivityData.score}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: [0.85, 1.15, 1] }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  {productivityData.score}
                </motion.div>
                <Badge variant="outline" className="mb-2">
                  {productivityData.level}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Taux de complétion : <span className="font-semibold">{Math.round(productivityData.completionRate)}%</span>
                </p>
              </div>
              <div className="text-right mt-4 sm:mt-0">
                <Button asChild variant="outline" size="sm">
                  <Link to="/analysis">
                    Voir l'analyse complète
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions rapides */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {quickActions.map((action, idx) => (
              <motion.div
                key={action.name}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                custom={idx}
                className="h-full"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link to={action.href}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-medium text-sm">{action.name}</p>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Badges récents */}
      {productivityData.badges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Badges obtenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {productivityData.badges.slice(0, 4).map((badge, index) => (
                  <Badge key={index} variant="secondary">
                    {badge}
                  </Badge>
                ))}
                {productivityData.badges.length > 4 && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/badges">
                      Voir tous les badges ({productivityData.badges.length})
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Statistiques rapides */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 36 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } }
        }}
      >
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{Math.round(productivityData.focusTimeScore)}</div>
              <p className="text-sm text-muted-foreground">Score Focus</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{Math.round(productivityData.consistencyScore)}</div>
              <p className="text-sm text-muted-foreground">Score Consistance</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{Math.round(productivityData.journalScore)}</div>
              <p className="text-sm text-muted-foreground">Score Journal</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
