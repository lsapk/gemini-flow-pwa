
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookOpenCheckIcon } from "@/components/icons/DeepFlowIcons";
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO } from 'date-fns';
import { JournalEntry } from "@/types/models";

interface JournalEntryFormData {
  title: string;
  content: string;
  created_at: Date | undefined;
}

const JournalEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <BookOpenCheckIcon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucune entrée de journal</h3>
    <p className="text-muted-foreground mb-4">
      Commencez à écrire votre première entrée de journal pour suivre vos pensées et vos expériences.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle entrée
    </Button>
  </div>
);

const Journal = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalEntryFormData>({
    title: "",
    content: "",
    created_at: undefined,
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchJournalEntries();
  }, [user]);

  const fetchJournalEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data } = await getJournalEntries();
      
      setJournalEntries(data || []);
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
        user_id: user.id,
        created_at: formData.created_at ? formData.created_at.toISOString() : new Date().toISOString(),
      };
      
      const { data } = await createJournalEntry(newEntry);
      
      setJournalEntries([...(data ? [data] : []), ...journalEntries]);
      
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
        created_at: formData.created_at ? formData.created_at.toISOString() : new Date().toISOString(),
      };
      
      const { data } = await updateJournalEntry(editingEntry.id, updatedEntry);
      
      if (data) {
        setJournalEntries(journalEntries.map((entry) => (entry.id === editingEntry.id ? data : entry)));
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
      const { success } = await deleteJournalEntry(id);
      
      if (success) {
        setJournalEntries(journalEntries.filter((entry) => entry.id !== id));
        
        toast({
          title: "Entrée supprimée",
          description: "Votre entrée de journal a été supprimée avec succès.",
        });
      }
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
      created_at: undefined,
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      created_at: entry.created_at ? parseISO(entry.created_at) : undefined,
    });
    setOpenDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpenCheckIcon className="h-8 w-8" />
            Journal
          </h1>
          <p className="text-muted-foreground">
            Écrivez vos pensées et vos expériences.
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Modifier l'entrée" : "Nouvelle entrée"}</DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Modifiez les détails de votre entrée de journal."
                  : "Créez une nouvelle entrée de journal pour suivre vos pensées et vos expériences."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'entrée..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Écrivez votre entrée de journal ici..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Date de création</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.created_at ? (
                        format(formData.created_at, "P", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.created_at}
                      onSelect={(date) => setFormData({ ...formData, created_at: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                {editingEntry ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos entrées de journal</CardTitle>
          <CardDescription>
            Suivez vos pensées et vos expériences au fil du temps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-md">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : journalEntries.length > 0 ? (
            <div className="space-y-4">
              {journalEntries.map((entry) => (
                <Card key={entry.id} className="glass-card">
                  <CardHeader>
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription>
                      {format(parseISO(entry.created_at), "dd/MM/yyyy", { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {entry.content.length > 200 ? entry.content.substring(0, 200) + "..." : entry.content}
                    </p>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(entry)}
                      >
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
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <JournalEmptyState onCreate={() => setOpenDialog(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Journal;
