import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JournalEntryCard from "@/components/JournalEntryCard";
import { Plus, BookOpen, X, Sparkles, RefreshCw, Send, Check, Pencil, Trash2, Lightbulb, History } from "lucide-react";
import { JournalEntry } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const moods = [
  { value: "excellent", label: "🌟 Excellent", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { value: "tres-heureux", label: "😄 Très heureux", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { value: "heureux", label: "😊 Heureux", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { value: "bien", label: "🙂 Bien", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { value: "motive", label: "💪 Motivé", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  { value: "calme", label: "🧘 Calme", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400" },
  { value: "confiant", label: "😎 Confiant", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { value: "inspire", label: "✨ Inspiré", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  { value: "energique", label: "⚡ Énergique", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { value: "neutre", label: "😐 Neutre", color: "bg-secondary text-muted-foreground" },
  { value: "fatigue", label: "😴 Fatigué", color: "bg-secondary text-muted-foreground" },
  { value: "stresse", label: "😰 Stressé", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { value: "anxieux", label: "😟 Anxieux", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { value: "triste", label: "😢 Triste", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  { value: "frustre", label: "😤 Frustré", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  { value: "en-colere", label: "😡 En colère", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
];

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

interface Reflection {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export default function Journal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("journal");
  const [loading, setLoading] = useState(true);

  // Journal State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const getDefaultTitle = () => format(new Date(), "dd MMMM yyyy", { locale: fr });
  const [title, setTitle] = useState(getDefaultTitle());
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");

  // Reflection State
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [editingReflectionId, setEditingReflectionId] = useState<string | null>(null);
  const [editReflectionAnswer, setEditReflectionAnswer] = useState("");
  const [deleteReflectionId, setDeleteReflectionId] = useState<string | null>(null);

  const getRandomQuestion = () => REFLECTION_QUESTIONS[Math.floor(Math.random() * REFLECTION_QUESTIONS.length)];

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [journalRes, reflectionRes] = await Promise.all([
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (journalRes.error) throw journalRes.error;
      if (reflectionRes.error) throw reflectionRes.error;

      setEntries((journalRes.data || []).map(entry => ({
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? [entry.tags] : []),
        updated_at: entry.updated_at || entry.created_at
      })));
      setReflections(reflectionRes.data || []);

      if (!currentQuestion) setCurrentQuestion(getRandomQuestion());
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // Journal Handlers
  const resetJournalForm = () => { setTitle(getDefaultTitle()); setContent(""); setMood(""); setEditingEntry(null); setShowJournalForm(false); };
  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    try {
      const entryData = { title: title.trim(), content: content.trim(), mood: mood || null, tags: null, user_id: user.id };
      if (editingEntry) {
        const { error } = await supabase.from('journal_entries').update(entryData).eq('id', editingEntry.id);
        if (error) throw error; toast.success('Entrée mise à jour !');
      } else {
        const { error } = await supabase.from('journal_entries').insert(entryData);
        if (error) throw error; toast.success('Entrée créée !');
      }
      resetJournalForm(); fetchData();
    } catch (error) { toast.error('Erreur'); }
  };
  const handleJournalEdit = (entry: JournalEntry) => { setEditingEntry(entry); setTitle(entry.title); setContent(entry.content); setMood(entry.mood || ""); setShowJournalForm(true); };
  const handleJournalDelete = async (entryId: string) => { if (!confirm('Supprimer cette entrée ?')) return; try { const { error } = await supabase.from('journal_entries').delete().eq('id', entryId); if (error) throw error; toast.success('Entrée supprimée !'); fetchData(); } catch (error) { toast.error('Erreur'); } };

  // Reflection Handlers
  const generateNewQuestion = () => { setCurrentQuestion(getRandomQuestion()); setReflectionAnswer(""); };
  const saveReflection = async () => {
    if (!user || !currentQuestion.trim() || !reflectionAnswer.trim()) return;
    setIsSavingReflection(true);
    try {
      const { error } = await supabase.from('daily_reflections').insert({ user_id: user.id, question: currentQuestion, answer: reflectionAnswer.trim() });
      if (error) throw error;
      toast.success('Réflexion sauvegardée !'); setReflectionAnswer(""); generateNewQuestion(); fetchData();
    } catch { toast.error('Erreur'); } finally { setIsSavingReflection(false); }
  };
  const updateReflection = async (id: string) => {
    if (!user || !editReflectionAnswer.trim()) return;
    try {
      const { error } = await supabase.from('daily_reflections').update({ answer: editReflectionAnswer.trim() }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Réflexion modifiée !'); setEditingReflectionId(null); fetchData();
    } catch { toast.error('Erreur'); }
  };
  const deleteReflection = async () => {
    if (!user || !deleteReflectionId) return;
    try {
      const { error } = await supabase.from('daily_reflections').delete().eq('id', deleteReflectionId).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Réflexion supprimée'); setDeleteReflectionId(null); fetchData();
    } catch { toast.error('Erreur'); }
  };

  const getMoodInfo = (v: string) => moods.find(m => m.value === v);

  if (loading && entries.length === 0 && reflections.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Journal & Réflexion</h1>
            <p className="text-sm text-muted-foreground font-medium">Capturez vos pensées et évoluez chaque jour</p>
          </div>
        </div>
        <div className="flex bg-secondary/40 backdrop-blur-xl p-1 rounded-2xl border border-border/20 self-stretch sm:self-auto">
          <button onClick={() => setActiveTab("journal")} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300", activeTab === "journal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Journal</button>
          <button onClick={() => setActiveTab("reflection")} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300", activeTab === "reflection" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Réflexion</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "journal" ? (
          <motion.div key="journal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
            {/* Journal Form Toggle */}
            {!showJournalForm && (
              <Button onClick={() => setShowJournalForm(true)} className="w-full h-16 rounded-[1.5rem] border-dashed border-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 font-bold text-lg active:scale-[0.98] transition-all">
                <Plus className="h-6 w-6 mr-2" /> Écrire une nouvelle entrée
              </Button>
            )}

            {/* Journal Entry Form */}
            {showJournalForm && (
              <Card className="rounded-[2rem] bg-card/40 backdrop-blur-xl border-primary/10 overflow-hidden shadow-2xl shadow-primary/5">
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-primary/5">
                  <CardTitle className="text-xl font-heading">{editingEntry ? "Modifier l'entrée" : "Nouvelle pensée"}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={resetJournalForm} className="rounded-xl"><X className="h-5 w-5" /></Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleJournalSubmit} className="space-y-6">
                    <Input placeholder="Titre de votre journée" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-12 text-lg font-bold bg-transparent border-none focus-visible:ring-0 px-0" />
                    <Textarea placeholder="Cher journal..." value={content} onChange={(e) => setContent(e.target.value)} required className="min-h-[200px] text-base leading-relaxed bg-transparent border-none focus-visible:ring-0 px-0 resize-none" />

                    <div className="space-y-3">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Humeur</p>
                      <div className="flex flex-wrap gap-2">
                        {moods.map(m => (
                          <button key={m.value} type="button" onClick={() => setMood(mood === m.value ? "" : m.value)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all duration-300", mood === m.value ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60")}>{m.label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-primary/5">
                      <Button type="submit" className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">{editingEntry ? 'Mettre à jour' : 'Enregistrer'}</Button>
                      <Button type="button" variant="ghost" onClick={resetJournalForm} className="rounded-2xl h-12 font-bold">Annuler</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Journal Entries List */}
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="h-20 w-20 rounded-[2.5rem] bg-secondary/30 flex items-center justify-center mx-auto mb-4"><BookOpen className="h-10 w-10 text-muted-foreground/30" /></div>
                  <h3 className="text-xl font-bold">Votre journal est prêt</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">Capturez vos moments, vos victoires et vos leçons dès aujourd'hui.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <JournalEntryCard key={entry.id} entry={entry} moods={moods} onEdit={handleJournalEdit} onDelete={handleJournalDelete} getMoodInfo={getMoodInfo} />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="reflection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
            {/* Reflection Question Card */}
            <Card className="rounded-[2rem] bg-gradient-to-br from-primary/10 via-primary/5 to-purple-500/10 border-primary/10 overflow-hidden shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                  <Sparkles className="h-4 w-4" /> Question du jour
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-extrabold leading-tight">{currentQuestion}</h2>
                <Textarea value={reflectionAnswer} onChange={(e) => setReflectionAnswer(e.target.value)} placeholder="Explorez cette question sans filtre..." className="min-h-[150px] bg-background/50 border-none rounded-2xl p-4 focus-visible:ring-primary/20 text-lg leading-relaxed shadow-inner" />
                <div className="flex gap-3">
                  <Button onClick={saveReflection} disabled={isSavingReflection || !reflectionAnswer.trim()} className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
                    <Send className="h-4 w-4 mr-2" /> Enregistrer
                  </Button>
                  <Button variant="ghost" onClick={generateNewQuestion} className="rounded-2xl h-12 font-bold"><RefreshCw className="h-4 w-4 mr-2" /> Changer</Button>
                </div>
              </CardContent>
            </Card>

            {/* Reflection History */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-2"><History className="h-4 w-4" /> Réflexions passées</h3>
              {reflections.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm font-medium">Aucune réflexion enregistrée pour le moment.</div>
              ) : (
                reflections.map((r) => (
                  <Card key={r.id} className="rounded-[2rem] bg-card/40 border-primary/5 hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg text-[10px] font-bold uppercase">{format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}</Badge>
                        <div className="flex gap-1">
                          {editingReflectionId === r.id ? (
                            <><Button size="icon" variant="ghost" onClick={() => updateReflection(r.id)}><Check className="h-4 w-4 text-green-500" /></Button><Button size="icon" variant="ghost" onClick={() => setEditingReflectionId(null)}><X className="h-4 w-4" /></Button></>
                          ) : (
                            <><Button size="icon" variant="ghost" onClick={() => { setEditingReflectionId(r.id); setEditReflectionAnswer(r.answer); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setDeleteReflectionId(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-foreground/90">{r.question}</p>
                      {editingReflectionId === r.id ? (
                        <Textarea value={editReflectionAnswer} onChange={(e) => setEditReflectionAnswer(e.target.value)} className="min-h-[100px] bg-secondary/20 rounded-xl border-none focus-visible:ring-primary/10" autoFocus />
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.answer}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteReflectionId} onOpenChange={(open) => !open && setDeleteReflectionId(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader><AlertDialogTitle>Supprimer cette réflexion ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel><AlertDialogAction onClick={deleteReflection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
