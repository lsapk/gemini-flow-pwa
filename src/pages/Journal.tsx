import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JournalEntryCard from "@/components/JournalEntryCard";
import { Plus, BookOpen, X } from "lucide-react";
import { JournalEntry } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const getDefaultTitle = () => format(new Date(), "dd MMMM yyyy", { locale: fr });
  const [title, setTitle] = useState(getDefaultTitle());
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");

  const fetchEntries = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      const transformed: JournalEntry[] = (data || []).map(entry => ({ ...entry, tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? [entry.tags] : []), updated_at: entry.updated_at || entry.created_at }));
      setEntries(transformed);
    } catch (error) { console.error(error); toast.error('Erreur lors du chargement'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const resetForm = () => { setTitle(getDefaultTitle()); setContent(""); setMood(""); setEditingEntry(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
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
      resetForm(); fetchEntries();
    } catch (error) { console.error(error); toast.error('Erreur lors de la sauvegarde'); }
  };

  const handleEdit = (entry: JournalEntry) => { setEditingEntry(entry); setTitle(entry.title); setContent(entry.content); setMood(entry.mood || ""); setShowForm(true); };
  const handleDelete = async (entryId: string) => { if (!confirm('Supprimer cette entrée ?')) return; try { const { error } = await supabase.from('journal_entries').delete().eq('id', entryId); if (error) throw error; toast.success('Entrée supprimée !'); fetchEntries(); } catch (error) { toast.error('Erreur'); } };
  const getMoodInfo = (v: string) => moods.find(m => m.value === v);

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <Skeleton className="h-5 w-48 rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Journal Personnel</h1>
            <p className="text-sm text-muted-foreground">
              Capturez vos pensées et émotions
              {entries.length > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full text-xs">{entries.length} entrée{entries.length > 1 ? 's' : ''}</Badge>
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-2xl active:scale-[0.95] transition-transform">
          <Plus className="h-4 w-4 mr-2" />Nouvelle entrée
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-card/80 border-border/40 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{editingEntry ? "Modifier l'entrée" : "Nouvelle entrée"}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8 rounded-xl"><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  <Textarea placeholder="Écrivez vos pensées..." value={content} onChange={(e) => setContent(e.target.value)} required className="min-h-[160px]" />

                  {/* Mood Grid */}
                  <div>
                    <p className="text-sm font-medium mb-2">Comment vous sentez-vous ?</p>
                    <div className="flex flex-wrap gap-2">
                      {moods.map(m => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMood(mood === m.value ? "" : m.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-[0.95] ${
                            mood === m.value
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="rounded-2xl active:scale-[0.95] transition-transform">{editingEntry ? 'Mettre à jour' : 'Créer'}</Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="rounded-2xl">Annuler</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card/30 rounded-3xl border border-border/40 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Votre journal est vide</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Commencez par créer votre première entrée.</p>
            <Button onClick={() => setShowForm(true)} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Créer une entrée</Button>
          </div>
        ) : (
          entries.map((entry, i) => (
            <JournalEntryCard key={entry.id} entry={entry} moods={moods} onEdit={handleEdit} onDelete={handleDelete} getMoodInfo={getMoodInfo} />
          ))
        )}
      </div>
    </div>
  );
}
