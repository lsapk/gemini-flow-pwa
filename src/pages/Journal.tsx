
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { PlusCircle, BookOpen, PenLine, Smile, Meh, Frown, Pencil, Trash2 } from "lucide-react";
import { BookOpenTextIcon } from "@/components/icons/DeepFlowIcons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getJournalEntries, addJournalEntry, getJournalEntry, updateJournalEntry, deleteJournalEntry } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define mood options
const moodOptions = [
  { value: "great", label: "Excellent", icon: <Smile className="h-5 w-5 text-green-500" /> },
  { value: "good", label: "Bon", icon: <Smile className="h-5 w-5 text-blue-500" /> },
  { value: "neutral", label: "Neutre", icon: <Meh className="h-5 w-5 text-amber-500" /> },
  { value: "bad", label: "Mauvais", icon: <Frown className="h-5 w-5 text-orange-500" /> },
  { value: "terrible", label: "Terrible", icon: <Frown className="h-5 w-5 text-red-500" /> },
];

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  user_id: string;
}

interface JournalFormData {
  title: string;
  content: string;
  mood: string;
}

const JournalEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mx-auto rounded-full bg-primary/10 p-4">
      <BookOpen className="h-8 w-8 text-primary" />
    </div>
    <h3 className="mt-4 text-lg font-medium">Journal vide</h3>
    <p className="mb-4 mt-2 text-sm text-muted-foreground">
      Commencez à écrire dans votre journal pour documenter vos pensées et réflexions.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle entrée
    </Button>
  </Card>
);

const MoodIcon = ({ mood }: { mood: string | undefined }) => {
  if (!mood) return null;
  const moodOption = moodOptions.find((option) => option.value === mood);
  return moodOption?.icon || null;
};

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalFormData>({
    title: "",
    content: "",
    mood: "",
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await getJournalEntries();
      
      if (error) throw new Error(error.message);
      
      setEntries(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos entrées de journal.",
        variant: "destructive",
      });
      console.error("Error fetching journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntry = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await getJournalEntry(id);
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setViewEntry(data);
        setOpenViewDialog(true);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger cette entrée de journal.",
        variant: "destructive",
      });
      console.error("Error fetching journal entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!user) return;
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre et un contenu pour votre entrée de journal.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newEntry = {
        title: formData.title,
        content: formData.content,
        mood: formData.mood || null,
        user_id: user.id
      };
      
      const { data, error } = await addJournalEntry(newEntry);
      
      if (error) throw new Error(error.message);
      
      setEntries([...(data ? [data] : []), ...entries]);
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Entrée créée",
        description: "Votre nouvelle entrée de journal a été créée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'entrée de journal.",
        variant: "destructive",
      });
      console.error("Error creating journal entry:", error);
    }
  };

  const handleUpdateEntry = async () => {
    if (!user || !editingEntry) return;
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre et un contenu pour votre entrée de journal.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedEntry = {
        title: formData.title,
        content: formData.content,
        mood: formData.mood || null,
      };
      
      const { data, error } = await updateJournalEntry(editingEntry.id, updatedEntry);
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setEntries(entries.map((entry) => (entry.id === editingEntry.id ? data : entry)));
      }
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Entrée mise à jour",
        description: "Votre entrée de journal a été mise à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'entrée de journal.",
        variant: "destructive",
      });
      console.error("Error updating journal entry:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await deleteJournalEntry(id);
      
      if (error) throw new Error(error.message);
      
      setEntries(entries.filter((entry) => entry.id !== id));
      
      toast({
        title: "Entrée supprimée",
        description: "Votre entrée de journal a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée de journal.",
        variant: "destructive",
      });
      console.error("Error deleting journal entry:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      mood: "",
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || "",
    });
    setOpenDialog(true);
  };
  
  // Group entries by month
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = parseISO(entry.created_at);
    const month = format(date, 'MMMM yyyy', { locale: fr });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpenTextIcon className="h-8 w-8" />
            Journal personnel
          </h1>
          <p className="text-muted-foreground">
            Notez vos pensées, réflexions et accomplissements quotidiens.
          </p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle entrée
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Modifier l'entrée" : "Nouvelle entrée"}</DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Modifiez votre entrée de journal."
                  : "Écrivez vos pensées et réflexions."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de votre entrée..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mood">Humeur</Label>
                <Select
                  value={formData.mood}
                  onValueChange={(value) => setFormData({ ...formData, mood: value })}
                >
                  <SelectTrigger id="mood" className="w-full">
                    <SelectValue placeholder="Comment vous sentez-vous?" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value}>
                        <span className="flex items-center gap-2">
                          {mood.icon} {mood.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Écrivez vos pensées ici..."
                  rows={10}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm();
                setOpenDialog(false);
              }}>
                Annuler
              </Button>
              <Button onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}>
                {editingEntry ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            {viewEntry && (
              <>
                <DialogHeader className="space-y-2">
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-2xl">{viewEntry.title}</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setOpenViewDialog(false);
                        openEditDialog(viewEntry);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action ne peut pas être annulée. Cela supprimera définitivement cette entrée de journal.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                handleDeleteEntry(viewEntry.id);
                                setOpenViewDialog(false);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <time dateTime={viewEntry.created_at}>
                        {format(parseISO(viewEntry.created_at), "PPPp", { locale: fr })}
                      </time>
                      {viewEntry.mood && (
                        <span className="flex items-center gap-1">
                          • <MoodIcon mood={viewEntry.mood} />
                        </span>
                      )}
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="mt-6 space-y-4 prose prose-sm dark:prose-invert max-w-none">
                  {viewEntry.content.split("\n").map((paragraph, i) => (
                    paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
                  ))}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <JournalEmptyState onCreate={() => setOpenDialog(true)} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([month, monthEntries]) => (
            <div key={month} className="space-y-4">
              <h2 className="text-xl font-semibold first-letter:uppercase">{month}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthEntries.map((entry) => (
                  <Card 
                    key={entry.id} 
                    className="glass-card hover:shadow-md cursor-pointer transition-all"
                    onClick={() => handleViewEntry(entry.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="line-clamp-1">{entry.title}</CardTitle>
                        {entry.mood && <MoodIcon mood={entry.mood} />}
                      </div>
                      <CardDescription>
                        {format(parseISO(entry.created_at), "PP", { locale: fr })}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm line-clamp-3">
                        {entry.content}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="pt-0 flex justify-between">
                      <Button variant="ghost" size="sm">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Lire
                      </Button>
                      
                      <Button variant="ghost" size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(entry);
                        }}
                      >
                        <PenLine className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Journal;
