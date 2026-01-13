
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JournalEntryCard from "@/components/JournalEntryCard";
import { JournalStats } from "@/components/ui/JournalStats";
import { Plus, BookOpen } from "lucide-react";
import { JournalEntry } from "@/types";
import { useGamificationRewards } from "@/hooks/useGamificationRewards";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const moods = [
  { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-800" },
  { value: "tres-heureux", label: "Très heureux", color: "bg-green-100 text-green-800" },
  { value: "heureux", label: "Heureux", color: "bg-blue-100 text-blue-800" },
  { value: "bien", label: "Bien", color: "bg-blue-100 text-blue-800" },
  { value: "motive", label: "Motivé", color: "bg-purple-100 text-purple-800" },
  { value: "optimiste", label: "Optimiste", color: "bg-yellow-100 text-yellow-800" },
  { value: "reconnaissant", label: "Reconnaissant", color: "bg-pink-100 text-pink-800" },
  { value: "calme", label: "Calme", color: "bg-teal-100 text-teal-800" },
  { value: "paisible", label: "Paisible", color: "bg-teal-100 text-teal-800" },
  { value: "serein", label: "Serein", color: "bg-teal-100 text-teal-800" },
  { value: "confiant", label: "Confiant", color: "bg-blue-100 text-blue-800" },
  { value: "inspire", label: "Inspiré", color: "bg-purple-100 text-purple-800" },
  { value: "cratif", label: "Créatif", color: "bg-purple-100 text-purple-800" },
  { value: "energique", label: "Énergique", color: "bg-orange-100 text-orange-800" },
  { value: "enthousiaste", label: "Enthousiaste", color: "bg-yellow-100 text-yellow-800" },
  { value: "amoureux", label: "Amoureux", color: "bg-pink-100 text-pink-800" },
  { value: "compatissant", label: "Compatissant", color: "bg-pink-100 text-pink-800" },
  { value: "fier", label: "Fier", color: "bg-purple-100 text-purple-800" },
  { value: "satisfait", label: "Satisfait", color: "bg-green-100 text-green-800" },
  { value: "accompli", label: "Accompli", color: "bg-green-100 text-green-800" },
  { value: "neutre", label: "Neutre", color: "bg-gray-100 text-gray-800" },
  { value: "indifferent", label: "Indifférent", color: "bg-gray-100 text-gray-800" },
  { value: "vide", label: "Vide", color: "bg-gray-100 text-gray-800" },
  { value: "fatigue", label: "Fatigué", color: "bg-gray-100 text-gray-800" },
  { value: "epuise", label: "Épuisé", color: "bg-gray-100 text-gray-800" },
  { value: "accable", label: "Accablé", color: "bg-gray-100 text-gray-800" },
  { value: "stresse", label: "Stressé", color: "bg-orange-100 text-orange-800" },
  { value: "tendu", label: "Tendu", color: "bg-orange-100 text-orange-800" },
  { value: "nerveux", label: "Nerveux", color: "bg-orange-100 text-orange-800" },
  { value: "anxieux", label: "Anxieux", color: "bg-orange-100 text-orange-800" },
  { value: "inquiet", label: "Inquiet", color: "bg-orange-100 text-orange-800" },
  { value: "preoccupe", label: "Préoccupé", color: "bg-orange-100 text-orange-800" },
  { value: "angoisse", label: "Angoissé", color: "bg-red-100 text-red-800" },
  { value: "panique", label: "Paniqué", color: "bg-red-100 text-red-800" },
  { value: "triste", label: "Triste", color: "bg-red-100 text-red-800" },
  { value: "melancolique", label: "Mélancolique", color: "bg-red-100 text-red-800" },
  { value: "nostalgique", label: "Nostalgique", color: "bg-red-100 text-red-800" },
  { value: "decu", label: "Déçu", color: "bg-red-100 text-red-800" },
  { value: "desespere", label: "Désespéré", color: "bg-red-100 text-red-800" },
  { value: "abattu", label: "Abattu", color: "bg-red-100 text-red-800" },
  { value: "deprime", label: "Déprimé", color: "bg-red-100 text-red-800" },
  { value: "frustre", label: "Frustré", color: "bg-red-100 text-red-800" },
  { value: "irrite", label: "Irrité", color: "bg-red-100 text-red-800" },
  { value: "agace", label: "Agacé", color: "bg-red-100 text-red-800" },
  { value: "en-colere", label: "En colère", color: "bg-red-100 text-red-800" },
  { value: "furieux", label: "Furieux", color: "bg-red-100 text-red-800" },
  { value: "rage", label: "Rage", color: "bg-red-100 text-red-800" },
  { value: "jaloux", label: "Jaloux", color: "bg-yellow-100 text-yellow-800" },
  { value: "envieux", label: "Envieux", color: "bg-yellow-100 text-yellow-800" },
  { value: "honteux", label: "Honteux", color: "bg-red-100 text-red-800" },
  { value: "coupable", label: "Coupable", color: "bg-red-100 text-red-800" },
  { value: "embarrasse", label: "Embarrassé", color: "bg-red-100 text-red-800" },
  { value: "confus", label: "Confus", color: "bg-yellow-100 text-yellow-800" },
  { value: "perdu", label: "Perdu", color: "bg-yellow-100 text-yellow-800" },
  { value: "indecis", label: "Indécis", color: "bg-yellow-100 text-yellow-800" },
  { value: "surpris", label: "Surpris", color: "bg-indigo-100 text-indigo-800" },
  { value: "etonne", label: "Étonné", color: "bg-indigo-100 text-indigo-800" },
  { value: "choque", label: "Choqué", color: "bg-indigo-100 text-indigo-800" },
  { value: "excite", label: "Excité", color: "bg-purple-100 text-purple-800" },
  { value: "impatient", label: "Impatient", color: "bg-orange-100 text-orange-800" },
  { value: "curieux", label: "Curieux", color: "bg-blue-100 text-blue-800" },
  { value: "interesse", label: "Intéressé", color: "bg-blue-100 text-blue-800" },
  { value: "fascine", label: "Fasciné", color: "bg-purple-100 text-purple-800" },
  { value: "emerveille", label: "Émerveillé", color: "bg-yellow-100 text-yellow-800" },
  { value: "touche", label: "Touché", color: "bg-pink-100 text-pink-800" },
  { value: "emu", label: "Ému", color: "bg-pink-100 text-pink-800" }
];

export default function Journal() {
  const { user } = useAuth();
  const { awardXP } = useGamificationRewards();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form state - default title is today's date
  const getDefaultTitle = () => format(new Date(), "dd MMMM yyyy", { locale: fr });
  
  const [title, setTitle] = useState(getDefaultTitle());
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData: JournalEntry[] = (data || []).map(entry => ({
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? [entry.tags] : []),
        updated_at: entry.updated_at || entry.created_at
      }));
      
      setEntries(transformedData);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Erreur lors du chargement des entrées');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const resetForm = () => {
    setTitle(getDefaultTitle());
    setContent("");
    setMood("");
    setTags("");
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    try {
      const entryData = {
        title: title.trim(),
        content: content.trim(),
        mood: mood || null,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        user_id: user.id
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast.success('Entrée mise à jour !');
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert(entryData);
        
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
    setTags(Array.isArray(entry.tags) ? entry.tags.join(', ') : "");
    setShowForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      toast.success('Entrée supprimée !');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getMoodInfo = (moodValue: string) => {
    return moods.find(m => m.value === moodValue);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Journal Personnel
          </h1>
          <p className="text-muted-foreground">
            Notez vos pensées, réflexions et émotions
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle entrée
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Titre de votre entrée"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Écrivez vos pensées..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger>
                      <SelectValue placeholder="Comment vous sentez-vous ?" />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    placeholder="Tags (séparés par des virgules)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingEntry ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune entrée</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première entrée de journal !
              </p>
              <Button onClick={() => setShowForm(true)}>
                Créer une entrée
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map(entry => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              moods={moods}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getMoodInfo={getMoodInfo}
            />
          ))
        )}
      </div>
    </div>
  );
}
