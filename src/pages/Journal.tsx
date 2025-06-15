import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  BookOpen, 
  Calendar,
  Edit,
  Trash2,
  Filter,
  Search
} from "lucide-react";
import { JournalEntry } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as journalApi from "@/lib/journalApi";
import JournalEntryCard from "@/components/JournalEntryCard";
import { useMobile } from "@/hooks/use-mobile";
import JournalMoodSummary from "@/components/JournalMoodSummary";

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    tags: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

  const moods = [
    { value: 'happy', label: '😊 Heureux', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sad', label: '😢 Triste', color: 'bg-blue-100 text-blue-800' },
    { value: 'excited', label: '🤩 Exité', color: 'bg-orange-100 text-orange-800' },
    { value: 'calm', label: '😌 Calme', color: 'bg-green-100 text-green-800' },
    { value: 'stressed', label: '😰 Stressé', color: 'bg-red-100 text-red-800' },
    { value: 'grateful', label: '🙏 Reconnaissant', color: 'bg-purple-100 text-purple-800' },
    { value: 'motivated', label: '💪 Motivé', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'thoughtful', label: '🤔 Pensif', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, moodFilter]);

  const loadEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await journalApi.getJournalEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les entrées du journal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (moodFilter !== 'all') {
      filtered = filtered.filter(entry => entry.mood === moodFilter);
    }

    setFilteredEntries(filtered);
  };

  const handleSubmit = async () => {
    if (!user || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et le contenu sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      const entryData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        mood: formData.mood || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined
      };

      if (editingEntry) {
        const updatedEntry = await journalApi.updateJournalEntry(editingEntry.id, entryData);
        setEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        ));

        toast({
          title: "Entrée modifiée",
          description: "Votre entrée de journal a été mise à jour avec succès.",
        });
      } else {
        const newEntry = await journalApi.createJournalEntry(entryData);
        setEntries(prev => [newEntry, ...prev]);

        toast({
          title: "Entrée créée",
          description: "Votre nouvelle entrée de journal a été créée avec succès.",
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'entrée du journal.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', mood: '', tags: '' });
    setEditingEntry(null);
    setIsCreateOpen(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || '',
      tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : ''
    });
    setEditingEntry(entry);
    setIsCreateOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      await journalApi.deleteJournalEntry(entryId);
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      toast({
        title: "Entrée supprimée",
        description: "L'entrée du journal a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée du journal.",
        variant: "destructive",
      });
    }
  };

  const getMoodInfo = (moodValue: string) => {
    return moods.find(mood => mood.value === moodValue);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "pb-20 pt-3 px-1" : "container p-3 sm:p-6"} relative container mx-auto max-w-4xl`}>
      {/* Suppression du résumé visuel par humeur */}
      {/* <JournalMoodSummary entries={entries} moods={moods} /> */}

      {/* Haute barre d'en-tête (Nouveau bouton ici) */}
      <div className="flex items-center justify-between mt-2 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-xl sm:text-3xl font-bold">Mon Journal</h1>
        </div>
        {/* Nouveau bouton à droite */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="bg-[#715FFA] hover:bg-[#715FFA]/90 text-white font-semibold rounded-lg px-5 py-2 flex gap-2 items-center transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle entrée
        </Button>
      </div>

      {/* Dialog création/édition d'entrée */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          {/* plus de bouton flottant ici */}
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Modifier l'entrée" : "Nouvelle entrée de journal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de votre entrée"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="content">Contenu *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Écrivez vos pensées, réflexions, événements du jour..."
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mood">Humeur</Label>
                <Select
                  value={formData.mood}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Comment vous sentez-vous ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map(mood => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="travail, famille, voyage..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} className="flex-1">
                {editingEntry ? 'Modifier' : 'Créer'}
              </Button>
              <Button variant="outline" type="button" onClick={resetForm}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EN-TÊTE ET STATISTIQUES */}
      <div className={`flex ${isMobile ? "flex-col gap-2 mb-2" : "flex-row sm:items-center sm:justify-between gap-4 mb-4"}`}>
        
      </div>
      <div className={`${isMobile ? "flex flex-col gap-2 mb-3" : "flex flex-col md:flex-row gap-4 mb-4"}`}>
        {/* Statistiques */}
        <div className={isMobile ? "mb-0" : "flex-1"}>
          {/* Compact grid for mobile */}
          <div className={`grid ${isMobile ? "grid-cols-3 gap-1" : "grid-cols-1 sm:grid-cols-3 gap-4"}`}>
            <Card className={isMobile ? "p-0 shadow-none" : ""}>
              <CardContent className={isMobile ? "p-2" : "p-4"}>
                <div className="flex flex-col items-center justify-center">
                  <BookOpen className={`${isMobile ? "h-5 w-5 mb-1 text-blue-500" : "h-8 w-8 text-blue-500"} mx-auto`} />
                  <p className={`text-xs text-muted-foreground ${isMobile ? "mb-0.5" : ""}`}>Entrées</p>
                  <p className="text-lg font-bold">{entries.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className={isMobile ? "p-0 shadow-none" : ""}>
              <CardContent className={isMobile ? "p-2" : "p-4"}>
                <div className="flex flex-col items-center justify-center">
                  <Calendar className={`${isMobile ? "h-5 w-5 mb-1 text-green-500" : "h-8 w-8 text-green-500"} mx-auto`} />
                  <p className={`text-xs text-muted-foreground ${isMobile ? "mb-0.5" : ""}`}>Mois</p>
                  <p className="text-lg font-bold">
                    {entries.filter(entry => {
                      const entryDate = new Date(entry.created_at);
                      const now = new Date();
                      return entryDate.getMonth() === now.getMonth() && 
                             entryDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={isMobile ? "p-0 shadow-none" : ""}>
              <CardContent className={isMobile ? "p-2" : "p-4"}>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">
                      {(() => {
                        const moodCounts = entries.reduce((acc, entry) => {
                          if (entry.mood) {
                            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>);
                        
                        const topMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
                        // Emoji si label comprend emoji, sinon default
                        if (topMood) {
                          const moodInfo = getMoodInfo(topMood[0]);
                          if (moodInfo && moodInfo.label) {
                            const emoji = moodInfo.label.match(/([\u{1F600}-\u{1F64F}])/u);
                            return emoji ? emoji[0] : "📝";
                          }
                        }
                        return "📝";
                      })()}
                    </span>
                    <p className={`text-xs text-muted-foreground ${isMobile ? "mb-0.5 mt-0" : ""}`}>Humeur</p>
                    <p className="text-xs font-bold">
                      {(() => {
                        const moodCounts = entries.reduce((acc, entry) => {
                          if (entry.mood) {
                            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>);
                        
                        const topMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
                        const moodInfo = topMood ? getMoodInfo(topMood[0]) : null;
                        
                        return moodInfo ? moodInfo.label.replace(/^[^a-zA-Z0-9]+/, "") : "Aucune";
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Filtres (en dessous des statistiques sur mobile) */}
        <Card className={isMobile ? "w-full order-first" : "md:w-60 order-first md:order-none"}>
          <CardContent className={`p-3 space-y-2 ${isMobile ? "pb-2" : ""}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/80"
              />
            </div>
            <div>
              <Label>Filtrer par humeur</Label>
              <Select value={moodFilter} onValueChange={setMoodFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes les humeurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les humeurs</SelectItem>
                  {moods.map(mood => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des entrées */}
      <div className={`space-y-3 mt-2 ${isMobile ? "" : "space-y-5"}`}>
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {entries.length === 0 ? 'Aucune entrée de journal' : 'Aucune entrée trouvée'}
              </p>
              <p className="text-muted-foreground mb-4">
                {entries.length === 0
                  ? 'Commencez votre voyage de réflexion en créant votre première entrée.'
                  : 'Essayez de modifier vos critères de recherche.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              moods={moods}
              getMoodInfo={getMoodInfo}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
