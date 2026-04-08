import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Send, Sparkles, RefreshCw, Lightbulb, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reflection {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

const REFLECTION_QUESTIONS = [
  "Quelle est votre plus grande source de motivation dans la vie ?",
  "Qu'est-ce qui vous rend le plus fier(e) de vous ?",
  "Quels sont vos trois plus grands rêves ou aspirations ?",
  "Comment décririez-vous votre personnalité en quelques mots ?",
  "Quelle est votre plus grande force selon vous ?",
  "Qu'est-ce qui vous fait vous sentir le plus épanoui(e) ?",
  "Comment gérez-vous le stress et les défis ?",
  "Qu'est-ce qui vous inspire le plus chez les autres ?",
  "Quel impact aimeriez-vous avoir sur le monde ?",
  "Quelles sont vos valeurs les plus importantes ?",
  "Comment définiriez-vous le succès pour vous ?",
  "Qu'est-ce qui vous pousse à sortir de votre zone de confort ?",
  "Quelle version de vous-même voulez-vous devenir dans 5 ans ?",
  "Quelle habitude transformerait le plus votre vie si vous la maîtrisiez ?",
  "Quel aspect de votre vie mérite plus d'attention aujourd'hui ?",
  "Qu'est-ce que vous repoussez depuis trop longtemps et pourquoi ?",
  "Quelle peur vous empêche d'avancer vers vos objectifs ?",
  "Quelle est la leçon la plus importante que vous avez apprise cette année ?",
  "Quelle compétence voulez-vous absolument maîtriser et pourquoi ?",
  "Qu'est-ce qui différencie vos bonnes journées de vos mauvaises journées ?",
  "Quelle limite personnelle devez-vous dépasser pour grandir ?",
  "Quel sacrifice êtes-vous prêt(e) à faire pour atteindre vos objectifs ?",
  "Quelle croyance limitante devez-vous abandonner ?",
  "Comment mesurez-vous votre progression personnelle ?",
  "Quelle action quotidienne a le plus d'impact sur votre bien-être ?",
  "Comment équilibrez-vous ambition et contentement ?",
  "Quelle promesse devez-vous vous faire à vous-même ?",
  "Comment transformez-vous les échecs en opportunités d'apprentissage ?",
  "Comment cultivez-vous la gratitude au quotidien ?",
  "Quel changement de mentalité pourrait débloquer votre potentiel ?",
  "Comment créez-vous des moments de flow dans votre journée ?",
  "Quelle habitude toxique devez-vous éliminer définitivement ?",
  "Comment optimisez-vous votre énergie tout au long de la journée ?",
  "Comment cultivez-vous la résilience face aux obstacles ?",
  "Qui êtes-vous vraiment quand personne ne vous regarde ?",
  "Quel événement de votre enfance a le plus façonné qui vous êtes aujourd'hui ?",
  "Quelle partie de vous-même avez-vous du mal à accepter ?",
  "Quelle émotion avez-vous le plus de mal à exprimer et pourquoi ?",
  "Comment votre peur de l'échec influence-t-elle vos choix de vie ?",
  "Comment vos choix d'aujourd'hui façonnent-ils votre futur ?",
  "Quelle question devriez-vous vous poser plus souvent pour rester aligné(e) ?",
];

export default function Reflection() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAnswer, setEditAnswer] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();

  const getRandomQuestion = () => REFLECTION_QUESTIONS[Math.floor(Math.random() * REFLECTION_QUESTIONS.length)];

  const fetchReflections = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setReflections(data || []);
    } catch { toast.error('Erreur lors du chargement'); } finally { setLoadingData(false); }
  };

  const generateNewQuestion = () => { setCurrentQuestion(getRandomQuestion()); setAnswer(""); };

  const saveReflection = async () => {
    if (!user || !currentQuestion.trim() || !answer.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('daily_reflections').insert({ user_id: user.id, question: currentQuestion, answer: answer.trim() });
      if (error) throw error;
      toast.success('Réflexion sauvegardée !'); setAnswer(""); generateNewQuestion(); fetchReflections();
    } catch { toast.error('Erreur'); } finally { setIsLoading(false); }
  };

  const updateReflection = async (id: string) => {
    if (!user || !editAnswer.trim()) return;
    try {
      const { error } = await supabase.from('daily_reflections').update({ answer: editAnswer.trim() }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Réflexion modifiée !');
      setEditingId(null);
      fetchReflections();
    } catch { toast.error('Erreur lors de la modification'); }
  };

  const deleteReflection = async () => {
    if (!user || !deleteId) return;
    try {
      const { error } = await supabase.from('daily_reflections').delete().eq('id', deleteId).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Réflexion supprimée');
      setDeleteId(null);
      fetchReflections();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  useEffect(() => { fetchReflections(); generateNewQuestion(); }, [user]);

  if (loadingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 p-3 sm:p-6 min-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Réflexion personnelle</h1>
            <p className="text-sm text-muted-foreground">
              Explorez vos pensées profondes
              {reflections.length > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full text-xs">{reflections.length}</Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="reflect" className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="reflect">Réflexion</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="reflect" className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col gap-4"
            >
              <Card className="backdrop-blur-sm bg-gradient-to-br from-primary/5 to-primary/10 border-border/30 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Question du moment</p>
                      <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">{currentQuestion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-card/80 border-border/40 flex-1 flex flex-col">
                <CardContent className="p-4 sm:p-6 flex-1 flex flex-col gap-4">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Prenez le temps de réfléchir et écrivez votre réponse..."
                    className="flex-1 min-h-[50vh] text-base resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveReflection} disabled={isLoading || !answer.trim()} className="rounded-2xl active:scale-[0.95] transition-transform">
                      <Send className="h-4 w-4 mr-2" />{isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                    <Button variant="outline" onClick={generateNewQuestion} disabled={isLoading} className="rounded-2xl active:scale-[0.95] transition-transform">
                      <RefreshCw className="h-4 w-4 mr-2" />Nouvelle question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            {reflections.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-card/30 rounded-3xl border border-border/40 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucune réflexion</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Répondez à votre première question pour commencer.</p>
              </div>
            ) : (
              reflections.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <Card className="backdrop-blur-sm bg-card/80 border-border/30 hover:bg-card/90 transition-all duration-200">
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {editingId === r.id ? (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateReflection(r.id)}>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(r.id); setEditAnswer(r.answer); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(r.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-primary/5 rounded-xl">
                        <p className="font-medium text-sm">{r.question}</p>
                      </div>
                      {editingId === r.id ? (
                        <Textarea
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="text-sm min-h-[100px]"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground/85">{r.answer}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette réflexion ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReflection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
