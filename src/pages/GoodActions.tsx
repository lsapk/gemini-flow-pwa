
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  Plus, 
  ThumbsUp, 
  MessageSquare,
  Award,
  TrendingUp,
  Users,
  Sparkles,
  Target,
  Filter,
  Globe,
  User,
  Lock,
  Edit,
  Trash2,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { isAdminModeEnabled } from "@/lib/api";

interface GoodAction {
  id: string;
  title: string;
  description?: string;
  category: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  user_profiles?: {
    display_name: string;
    email: string;
  };
}

const CATEGORIES = [
  { value: 'environment', label: '🌱 Environnement', color: 'bg-green-100 text-green-800' },
  { value: 'community', label: '🤝 Communauté', color: 'bg-blue-100 text-blue-800' },
  { value: 'help', label: '❤️ Entraide', color: 'bg-red-100 text-red-800' },
  { value: 'learning', label: '📚 Apprentissage', color: 'bg-purple-100 text-purple-800' },
  { value: 'kindness', label: '✨ Bienveillance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'health', label: '💪 Santé', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: '🌟 Autre', color: 'bg-gray-100 text-gray-800' }
];

const DAILY_PROMPTS = [
  "Faites un compliment sincère à quelqu'un",
  "Ramassez un déchet dans la rue",
  "Aidez un collègue avec une tâche",
  "Appelez un proche pour prendre des nouvelles",
  "Partagez une connaissance utile",
  "Tenez la porte à quelqu'un",
  "Donnez un pourboire généreux",
  "Écoutez attentivement quelqu'un qui en a besoin",
  "Plantez une graine ou arrosez une plante",
  "Écrivez un message de remerciement"
];

export default function GoodActions() {
  const [goodActions, setGoodActions] = useState<GoodAction[]>([]);
  const [publicActions, setPublicActions] = useState<GoodAction[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("public");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState<GoodAction | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getTodaysPrompt = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  };

  const checkAdminStatus = () => {
    setIsAdmin(isAdminModeEnabled());
  };

  const loadMyGoodActions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('good_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoodActions(data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des bonnes actions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos bonnes actions.",
        variant: "destructive",
      });
    }
  };

  const loadPublicGoodActions = async () => {
    try {
      const { data, error } = await supabase
        .from('good_actions')
        .select(`
          *,
          user_profiles!inner (
            display_name,
            email
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading public good actions:', error);
        return;
      }
      setPublicActions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des bonnes actions publiques:', error);
      toast({
        title: "Erreur", 
        description: "Impossible de charger les bonnes actions publiques.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      loadMyGoodActions();
    }
    loadPublicGoodActions();
  }, [user]);

  const saveGoodAction = async () => {
    if (!user || !title.trim() || !category) return;
    
    setIsLoading(true);
    try {
      const actionData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        is_public: isPublic,
        likes_count: editingAction?.likes_count || 0,
        comments_count: editingAction?.comments_count || 0,
      };

      if (editingAction) {
        const { error } = await supabase
          .from('good_actions')
          .update(actionData)
          .eq('id', editingAction.id);

        if (error) throw error;
        
        toast({
          title: "Bonne action modifiée ! 🎉",
          description: "Votre bonne action a été mise à jour.",
        });
      } else {
        const { error } = await supabase
          .from('good_actions')
          .insert(actionData);

        if (error) throw error;
        
        toast({
          title: "Bonne action enregistrée ! 🎉",
          description: `Votre bonne action a été ${isPublic ? 'publiée' : 'enregistrée en privé'}.`,
        });
      }
      
      resetForm();
      loadMyGoodActions();
      loadPublicGoodActions();
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder votre bonne action.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGoodAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('good_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;
      
      toast({
        title: "Bonne action supprimée",
        description: "La bonne action a été supprimée avec succès.",
      });
      
      loadMyGoodActions();
      loadPublicGoodActions();
    } catch (error) {
      console.error('Error deleting good action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la bonne action.",
        variant: "destructive",
      });
    }
  };

  const likeAction = async (actionId: string) => {
    try {
      const action = publicActions.find(a => a.id === actionId);
      if (!action) return;

      const { error } = await supabase
        .from('good_actions')
        .update({ likes_count: action.likes_count + 1 })
        .eq('id', actionId);

      if (error) throw error;
      
      loadPublicGoodActions();
      toast({
        title: "J'aime ajouté ! ❤️",
        description: "Merci d'encourager cette bonne action !",
      });
    } catch (error) {
      console.error('Error liking action:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'aimer cette action.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setIsPublic(true);
    setEditingAction(null);
    setShowForm(false);
  };

  const editAction = (action: GoodAction) => {
    setTitle(action.title);
    setDescription(action.description || "");
    setCategory(action.category);
    setIsPublic(action.is_public);
    setEditingAction(action);
    setShowForm(true);
  };

  const filteredMyActions = goodActions.filter(action => 
    selectedFilter === "all" || action.category === selectedFilter
  );

  const filteredPublicActions = publicActions.filter(action => 
    selectedFilter === "all" || action.category === selectedFilter
  );

  const totalActions = goodActions.length;
  const publicActionsCount = goodActions.filter(a => a.is_public).length;
  const thisWeekActions = goodActions.filter(action => 
    new Date(action.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const categoriesCount = [...new Set(goodActions.map(a => a.category))].length;

  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Bonnes Actions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Cultivez la bienveillance et créez un impact positif
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span>Nouvelle BA</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-0 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAction ? "Modifier la bonne action" : "Nouvelle Bonne Action"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Titre</Label>
                <Input
                  placeholder="Ex: Aider mon voisin avec ses courses"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description (optionnel)</Label>
                <Textarea
                  placeholder="Décrivez brièvement votre bonne action..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public-mode"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-mode" className="flex items-center gap-2">
                  {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isPublic ? "Publique" : "Privée"}
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={saveGoodAction}
                  disabled={!title.trim() || !category || isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Sauvegarde..." : editingAction ? "Modifier" : "Publier ma BA"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {user && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{totalActions}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">BA totales</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{thisWeekActions}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Cette semaine</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{publicActionsCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Publiques</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{categoriesCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Catégories</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Suggestion du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base font-medium mb-3">{getTodaysPrompt()}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTitle(getTodaysPrompt());
              setShowForm(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            J'ai fait cette BA !
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Communauté</span>
            <span className="sm:hidden">Public</span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mes actions</span>
            <span className="sm:hidden">Perso</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-2 items-center mt-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="public" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Communauté ({filteredPublicActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 sm:space-y-4">
                  {filteredPublicActions.map((action) => {
                    const categoryInfo = CATEGORIES.find(c => c.value === action.category);
                    return (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-3 sm:p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm sm:text-base">{action.title}</h3>
                              <Badge className={`${categoryInfo?.color} text-xs ml-2 flex-shrink-0`}>
                                <span className="hidden sm:inline">{categoryInfo?.label}</span>
                                <span className="sm:hidden">{categoryInfo?.label.split(' ')[0]}</span>
                              </Badge>
                            </div>
                            {action.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {action.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Par {action.user_profiles?.display_name || 'Utilisateur anonyme'}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(action.created_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                          </div>
                          {isAdmin && action.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteGoodAction(action.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-3 sm:gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likeAction(action.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                              {action.likes_count || 0}
                            </Button>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                              {action.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {filteredPublicActions.length === 0 && (
                    <div className="text-center py-12">
                      <Globe className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium mb-2">Aucune bonne action publique</h3>
                      <p className="text-sm text-muted-foreground">
                        Soyez le premier à partager une bonne action !
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Vos bonnes actions ({filteredMyActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <AnimatePresence>
                  {filteredMyActions.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredMyActions.map((action, index) => {
                        const categoryInfo = CATEGORIES.find(c => c.value === action.category);
                        return (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border rounded-lg p-3 sm:p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-sm sm:text-base">{action.title}</h3>
                                  {!action.is_public && <Lock className="h-3 w-3 text-gray-400" />}
                                </div>
                                {action.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    {action.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editAction(action)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteGoodAction(action.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Badge className={`${categoryInfo?.color} text-xs flex-shrink-0`}>
                                <span className="hidden sm:inline">{categoryInfo?.label}</span>
                                <span className="sm:hidden">{categoryInfo?.label.split(' ')[0]}</span>
                              </Badge>
                              <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {action.likes_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {action.comments_count || 0}
                                </span>
                                <span>
                                  {format(new Date(action.created_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium mb-2">Aucune bonne action encore</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Commencez votre parcours de bienveillance dès aujourd'hui !
                      </p>
                      <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Ma première BA
                      </Button>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
