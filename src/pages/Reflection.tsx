import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Send, History, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Reflection {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

// Questions pour mieux connaître la personne et son développement personnel
const REFLECTION_QUESTIONS = [
  "Quelle est votre plus grande source de motivation dans la vie ?",
  "Qu'est-ce qui vous rend le plus fier(e) de vous ?",
  "Quels sont vos trois plus grands rêves ou aspirations ?",
  "Comment décririez-vous votre personnalité en quelques mots ?",
  "Quelle est votre plus grande force selon vous ?",
  "Qu'est-ce qui vous fait vous sentir le plus épanoui(e) ?",
  "Quels sont vos hobbies ou passions préférés ?",
  "Comment gérez-vous le stress et les défis ?",
  "Qu'est-ce qui vous inspire le plus chez les autres ?",
  "Quel impact aimeriez-vous avoir sur le monde ?",
  "Quelles sont vos valeurs les plus importantes ?",
  "Comment vous détendez-vous après une journée difficile ?",
  "Qu'est-ce qui vous donne de l'énergie ?",
  "Quel est votre environnement de travail idéal ?",
  "Comment définiriez-vous le succès pour vous ?",
  "Quels sont vos talents cachés ?",
  "Qu'est-ce qui vous fait rire le plus ?",
  "Comment prenez-vous vos décisions importantes ?",
  "Qu'est-ce qui vous pousse à sortir de votre zone de confort ?",
  "Quels sont vos rituels ou habitudes préférés ?",
  // Nouvelles questions développement personnel
  "Quelle version de vous-même voulez-vous devenir dans 5 ans ?",
  "Quelle habitude transformerait le plus votre vie si vous la maîtrisiez ?",
  "Quel aspect de votre vie mérite plus d'attention aujourd'hui ?",
  "Qu'est-ce que vous repoussez depuis trop longtemps et pourquoi ?",
  "Quelle peur vous empêche d'avancer vers vos objectifs ?",
  "Quelle est la leçon la plus importante que vous avez apprise cette année ?",
  "Comment pouvez-vous apporter plus de valeur aux autres aujourd'hui ?",
  "Quel compliment aimeriez-vous recevoir dans 10 ans ?",
  "Quelle compétence voulez-vous absolument maîtriser et pourquoi ?",
  "Qu'est-ce qui différencie vos bonnes journées de vos mauvaises journées ?",
  "Quelle limite personnelle devez-vous dépasser pour grandir ?",
  "Comment votre routine matinale influence-t-elle votre journée ?",
  "Quel sacrifice êtes-vous prêt(e) à faire pour atteindre vos objectifs ?",
  "Quelle croyance limitante devez-vous abandonner ?",
  "Comment mesurez-vous votre progression personnelle ?",
  "Qu'est-ce qui vous empêche d'être la meilleure version de vous-même ?",
  "Quelle action quotidienne a le plus d'impact sur votre bien-être ?",
  "Comment équilibrez-vous ambition et contentement ?",
  "Quel mentor ou modèle inspire votre développement personnel ?",
  "Quelle promesse devez-vous vous faire à vous-même ?",
  "Comment transformez-vous les échecs en opportunités d'apprentissage ?",
  "Quelle partie de votre vie nécessite plus de discipline ?",
  "Comment cultivez-vous la gratitude au quotidien ?",
  "Quel changement de mentalité pourrait débloquer votre potentiel ?",
  "Comment votre environnement influence-t-il votre productivité ?",
  "Quelle relation dans votre vie mérite plus d'investissement ?",
  "Comment gérez-vous la procrastination sur les tâches importantes ?",
  "Quel aspect de votre santé (physique, mentale, émotionnelle) négligez-vous ?",
  "Comment vos valeurs se reflètent-elles dans vos actions quotidiennes ?",
  "Quelle nouvelle perspective pourrait changer votre façon de voir les défis ?",
  "Comment créez-vous des moments de flow dans votre journée ?",
  "Quel rituel du soir optimiserait votre sommeil et votre récupération ?",
  "Comment votre dialogue intérieur affecte-t-il votre confiance ?",
  "Quelle habitude toxique devez-vous éliminer définitivement ?",
  "Comment investissez-vous dans votre développement intellectuel ?",
  "Quel équilibre cherchez-vous entre travail et vie personnelle ?",
  "Comment la méditation ou la pleine conscience pourraient améliorer votre vie ?",
  "Quelle compétence émotionnelle devez-vous développer ?",
  "Comment optimisez-vous votre énergie tout au long de la journée ?",
  "Quel système ou structure manque dans votre vie pour plus d'efficacité ?",
  "Comment cultivez-vous la résilience face aux obstacles ?",
  "Quel aspect de votre communication devez-vous améliorer ?",
  "Comment votre alimentation influence-t-elle votre performance mentale ?",
  "Quelle routine d'exercice physique correspondrait à votre style de vie ?",
  "Comment gérez-vous les distractions et les interruptions ?",
  "Quel livre ou formation pourrait accélérer votre croissance personnelle ?",
  "Comment mesurez-vous l'alignement entre vos actions et vos valeurs ?",
  "Quelle zone d'inconfort devez-vous explorer cette semaine ?",
  "Comment la visualisation de vos objectifs influence votre motivation ?",
  "Quel système de suivi pourrait améliorer votre responsabilité personnelle ?",
  "Comment optimisez-vous votre temps pour ce qui compte vraiment ?",
  "Quelle croyance positive devez-vous renforcer quotidiennement ?",
  "Comment votre réseau social influence-t-il votre développement ?",
  "Quel rituel de réflexion hebdomadaire pourrait transformer votre progression ?",
  "Comment équilibrez-vous planification et flexibilité dans votre vie ?",
  "Quelle contribution unique pouvez-vous apporter au monde ?",
  "Comment célébrez-vous vos victoires, même les plus petites ?",
  "Quel standard d'excellence voulez-vous établir pour vous-même ?",
  "Comment la journalisation pourrait clarifier vos pensées et objectifs ?",
  "Quelle routine de déconnexion digitale améliorerait votre bien-être ?",
  "Comment développez-vous votre intelligence émotionnelle au quotidien ?",
  "Quel investissement en vous-même aurait le meilleur retour sur investissement ?",
  "Comment transformez-vous les critiques en carburant pour votre croissance ?",
  "Quelle pratique spirituelle ou philosophique enrichirait votre vie ?",
  "Comment vos choix d'aujourd'hui façonnent-ils votre futur ?",
  "Quel héritage personnel voulez-vous laisser derrière vous ?",
  "Comment pouvez-vous simplifier votre vie pour plus de clarté ?",
  "Quelle question devriez-vous vous poser plus souvent pour rester aligné(e) ?"
];

export default function Reflection() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * REFLECTION_QUESTIONS.length);
    return REFLECTION_QUESTIONS[randomIndex];
  };

  const fetchReflections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReflections(data || []);
    } catch (error) {
      console.error('Error fetching reflections:', error);
      toast.error('Erreur lors du chargement des réflexions');
    }
  };

  const generateNewQuestion = () => {
    const question = getRandomQuestion();
    setCurrentQuestion(question);
    setAnswer("");
  };

  const saveReflection = async () => {
    if (!user || !currentQuestion.trim() || !answer.trim()) return;

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

      toast.success('Réflexion sauvegardée !');
      setAnswer("");
      generateNewQuestion();
      fetchReflections();
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReflections();
    generateNewQuestion();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Réflexion personnelle</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          {showHistory ? 'Masquer' : 'Historique'}
        </Button>
      </div>

      {!showHistory ? (
        <div className="space-y-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Question du moment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-medium">{currentQuestion}</p>
              </div>
              
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Prenez le temps de réfléchir et écrivez votre réponse..."
                className="min-h-[200px] text-base"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={saveReflection}
                  disabled={isLoading || !answer.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={generateNewQuestion}
                  disabled={isLoading}
                >
                  Nouvelle question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Historique des réflexions</h2>
            <Badge variant="secondary">
              {reflections.length} réflexion{reflections.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          {reflections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucune réflexion enregistrée pour le moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reflections.map((reflection) => (
                <Card key={reflection.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {format(new Date(reflection.created_at), 'dd MMM yyyy', { locale: fr })}
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">{reflection.question}</p>
                      </div>
                      
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed">{reflection.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
