
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Lightbulb, 
  Heart, 
  TrendingUp, 
  Calendar,
  Eye,
  BarChart3,
  RefreshCw,
  Save,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyReflection {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  user_id: string;
}

const DAILY_QUESTIONS = [
  "Qu'est-ce qui vous a le plus motivé aujourd'hui ?",
  "Une petite victoire que vous avez célébrée ?",
  "Si vous pouviez changer une chose dans votre journée, quelle serait-elle et pourquoi ?",
  "Une leçon apprise ou une idée inattendue ?",
  "Pour quoi êtes-vous reconnaissant aujourd'hui ?",
  "Quel moment vous a apporté le plus de joie ?",
  "Comment avez-vous fait preuve de courage aujourd'hui ?",
  "Qu'avez-vous découvert sur vous-même ?",
  "Quel impact positif avez-vous eu sur quelqu'un ?",
  "Qu'est-ce qui vous rend fier de votre journée ?",
  "Quel défi avez-vous surmonté ?",
  "Comment vous êtes-vous amélioré depuis hier ?",
];

export default function Reflection() {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Générer une question basée sur la date
  const getTodaysQuestion = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
  };

  // Charger les réflexions
  const loadReflections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      setReflections(data || []);
      
      // Vérifier si l'utilisateur a déjà répondu aujourd'hui
      const today = startOfToday();
      const todayReflection = data?.find(r => 
        new Date(r.created_at) >= today
      );
      setHasAnsweredToday(!!todayReflection);
      
    } catch (error) {
      console.error('Erreur lors du chargement des réflexions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos réflexions.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setCurrentQuestion(getTodaysQuestion());
    loadReflections();
  }, [user]);

  const saveReflection = async () => {
    if (!user || !answer.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('daily_reflections')
        .insert({
          user_id: user.id,
          question: currentQuestion,
          answer: answer.trim()
        });

      if (error) throw error;
      
      toast({
        title: "Réflexion sauvegardée ! 🎉",
        description: "Votre réflexion quotidienne a été enregistrée.",
      });
      
      setAnswer("");
      setHasAnsweredToday(true);
      loadReflections();
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder votre réflexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNewQuestion = () => {
    let newQuestion;
    do {
      newQuestion = DAILY_QUESTIONS[Math.floor(Math.random() * DAILY_QUESTIONS.length)];
    } while (newQuestion === currentQuestion);
    setCurrentQuestion(newQuestion);
    setAnswer("");
  };

  // Statistiques
  const totalReflections = reflections.length;
  const recentStreak = reflections.filter(r => 
    new Date(r.created_at) >= subDays(new Date(), 7)
  ).length;
  const averageWordCount = reflections.length > 0 
    ? Math.round(reflections.reduce((sum, r) => sum + r.answer.split(' ').length, 0) / reflections.length)
    : 0;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Micro-Réflexion Quotidienne</h1>
          <p className="text-muted-foreground">
            Quelques minutes pour cultiver la conscience de soi
          </p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="mb-2">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </Badge>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalReflections}</p>
              <p className="text-sm text-muted-foreground">Réflexions totales</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{recentStreak}</p>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{averageWordCount}</p>
              <p className="text-sm text-muted-foreground">Mots en moyenne</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question du jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Question du jour
            {hasAnsweredToday && (
              <Badge variant="outline" className="ml-auto">
                ✓ Répondu
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
            <p className="text-lg font-medium">{currentQuestion}</p>
          </div>
          
          {!hasAnsweredToday ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Prenez quelques instants pour réfléchir et noter vos pensées..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[120px]"
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={saveReflection}
                  disabled={!answer.trim() || isLoading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Sauvegarde..." : "Sauvegarder ma réflexion"}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={getNewQuestion}
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600">
                Merci pour votre réflexion d'aujourd'hui !
              </p>
              <p className="text-muted-foreground">
                Revenez demain pour une nouvelle question.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des réflexions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vos réflexions passées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <AnimatePresence>
              {reflections.length > 0 ? (
                <div className="space-y-4">
                  {reflections.map((reflection, index) => (
                    <motion.div
                      key={reflection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-primary">
                          {reflection.question}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(reflection.created_at), 'dd MMM', { locale: fr })}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {reflection.answer}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune réflexion pour le moment. Commencez dès aujourd'hui !
                  </p>
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
