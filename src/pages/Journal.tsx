import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JournalEntryCard from "@/components/JournalEntryCard";
import { Plus, BookOpen } from "lucide-react";
import { PagePenguinEmpty } from "@/components/penguin/PagePenguinEmpty";
import penguinJournal from "@/assets/penguin-journal.png";
import { JournalEntry } from "@/types";
import { usePenguinRewards } from "@/hooks/usePenguinRewards";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const moods = [
  { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-800" },
  { value: "tres-heureux", label: "Très heureux", color: "bg-green-100 text-green-800" },
  { value: "heureux", label: "Heureux", color: "bg-blue-100 text-blue-800" },
  { value: "bien", label: "Bien", color: "bg-blue-100 text-blue-800" },
  { value: "motive", label: "Motivé", color: "bg-purple-100 text-purple-800" },
  { value: "calme", label: "Calme", color: "bg-teal-100 text-teal-800" },
  { value: "confiant", label: "Confiant", color: "bg-blue-100 text-blue-800" },
  { value: "inspire", label: "Inspiré", color: "bg-purple-100 text-purple-800" },
  { value: "energique", label: "Énergique", color: "bg-orange-100 text-orange-800" },
  { value: "neutre", label: "Neutre", color: "bg-gray-100 text-gray-800" },
  { value: "fatigue", label: "Fatigué", color: "bg-gray-100 text-gray-800" },
  { value: "stresse", label: "Stressé", color: "bg-orange-100 text-orange-800" },
  { value: "anxieux", label: "Anxieux", color: "bg-orange-100 text-orange-800" },
  { value: "triste", label: "Triste", color: "bg-red-100 text-red-800" },
  { value: "frustre", label: "Frustré", color: "bg-red-100 text-red-800" },
  { value: "en-colere", label: "En colère", color: "bg-red-100 text-red-800" },
];

export default function Journal() {
  const { user } = useAuth();
  const { rewardJournalEntry } = usePenguinRewards();
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
      const transformed: JournalEntry[] = (data || []).map(entry => ({
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? [entry.tags] : []),
        updated_at: entry.updated_at || entry.created_at
      }));
      setEntries(transformed);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Erreur lors du chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const resetForm = () => {
    setTitle(getDefaultTitle());
    setContent("");
    setMood("");
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    try {
      const entryData = { title: title.trim(), content: content.trim(), mood: mood || null, tags: null, user_id: user.id };
      if (editingEntry) {
        const { error } = await supabase.from('journal_entries').update(entryData).eq('id', editingEntry.id);
        if (error) throw error;
        toast.success('Entrée mise à jour !');
      } else {
        const { error } = await supabase.from('journal_entries').insert(entryData);
        if (error) throw error;
        toast.success('Entrée créée !');
      }
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || "");
    setShowForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
      if (error) throw error;
      toast.success('Entrée supprimée !');
      fetchEntries();
    } catch (error) { toast.error('Erreur lors de la suppression'); }
  };

  const getMoodInfo = (moodValue: string) => moods.find(m => m.value === moodValue);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-1/2" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />Journal Personnel
          </h1>
          <p className="text-muted-foreground">Notez vos pensées, réflexions et émotions</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" />Nouvelle entrée</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingEntry ? "Modifier l'entrée" : "Nouvelle entrée"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="Écrivez vos pensées..." value={content} onChange={(e) => setContent(e.target.value)} required rows={6} />
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger><SelectValue placeholder="Comment vous sentez-vous ?" /></SelectTrigger>
                <SelectContent>
                  {moods.map(m => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="submit">{editingEntry ? 'Mettre à jour' : 'Créer'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <PagePenguinEmpty
            image={penguinJournal}
            title="Votre journal est vide"
            description="Commencez par créer votre première entrée pour capturer vos pensées."
          >
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />Créer une entrée
            </Button>
          </PagePenguinEmpty>
        ) : (
          entries.map(entry => (
            <JournalEntryCard key={entry.id} entry={entry} moods={moods} onEdit={handleEdit} onDelete={handleDelete} getMoodInfo={getMoodInfo} />
          ))
        )}
      </div>
    </div>
  );
}
