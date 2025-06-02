
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  Plus, 
  ThumbsUp, 
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Sparkles,
  Target,
  Filter,
  Globe,
  User
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
import GoodActionCard from "@/components/GoodActionCard";
import { getAllPublicGoodActions } from "@/lib/goodActionsApi";
import { isUserAdmin } from "@/lib/api";

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
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("public");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getTodaysPrompt = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  };

  const checkAdminStatus = async () => {
    if (user) {
      try {
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
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
      setGoodActions(data as GoodAction[] || []);
      
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
      const data = await getAllPublicGoodActions();
      setPublicActions(data as GoodAction[]);
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
      const { error } = await supabase
        .from('good_actions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          is_public: true
        });

      if (error) throw error;
      
      toast({
        title: "Bonne action enregistrée ! 🎉",
        description: "Votre bonne action a été ajoutée avec succès.",
      });
      
      setTitle("");
      setDescription("");
      setCategory("");
      setShowForm(false);
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

  const filteredMyActions = goodActions.filter(action => 
    selectedFilter === "all" || action.category === selectedFilter
  );

  const filteredPublicActions = publicActions.filter(action => 
    selectedFilter === "all" || action.category === selectedFilter
  );

  const totalActions = goodActions.length;
  const thisWeekActions = goodActions.filter(action => 
    new Date(action.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const categoriesCount = [...new Set(goodActions.map(a => a.category))].length;
  const impactScore = totalActions * 10 + thisWeekActions * 5;

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
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
              <span className="sm:inline">Ajouter une BA</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Nouvelle Bonne Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  placeholder="Ex: Aider mon voisin avec ses courses"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Catégorie</label>
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
                <label className="text-sm font-medium">Description (optionnel)</label>
                <Textarea
                  placeholder="Décrivez brièvement votre bonne action..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={saveGoodAction}
                disabled={!title.trim() || !category || isLoading}
                className="w-full"
              >
                {isLoading ? "Sauvegarde..." : "Publier ma BA"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {user && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalActions}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">BA totales</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{thisWeekActions}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Cette semaine</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{categoriesCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Catégories</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{impactScore}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Score d'impact</p>
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
          <p className="text-sm sm:text-lg font-medium mb-3">{getTodaysPrompt()}</p>
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
                Bonnes actions de la communauté ({filteredPublicActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 sm:space-y-4">
                  {filteredPublicActions.map((action) => (
                    <GoodActionCard 
                      key={action.id} 
                      action={action} 
                      isAdmin={isAdmin}
                    />
                  ))}
                  
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
                            className="border rounded-lg p-3 sm:p-4 space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium text-sm sm:text-base">{action.title}</h3>
                                {action.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    {action.description}
                                  </p>
                                )}
                              </div>
                              <Badge className={`${categoryInfo?.color} text-xs ml-2`}>
                                <span className="hidden sm:inline">{categoryInfo?.label}</span>
                                <span className="sm:hidden">{categoryInfo?.label.split(' ')[0]}</span>
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                              <span>
                                {format(new Date(action.created_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                              <div className="flex gap-3 sm:gap-4">
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {action.likes_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {action.comments_count || 0}
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
