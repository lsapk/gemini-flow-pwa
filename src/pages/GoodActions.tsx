
import { useState, useEffect } from "react";
import { Plus, Heart, MessageCircle, ThumbsUp, Share2, Filter, Search, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoodAction } from "@/types";

export default function GoodActions() {
  const [goodActions, setGoodActions] = useState<GoodAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("my-actions");
  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    category: "",
    is_public: false
  });
  const { user } = useAuth();

  const categories = [
    { value: "all", label: "Toutes" },
    { value: "environment", label: "Environnement" },
    { value: "community", label: "Communauté" },
    { value: "health", label: "Santé" },
    { value: "education", label: "Éducation" },
    { value: "social", label: "Social" },
    { value: "other", label: "Autre" }
  ];

  const fetchGoodActions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('good_actions')
        .select(`
          *,
          user_profiles!inner(display_name, photo_url)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === "my-actions") {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setGoodActions(data || []);
    } catch (error) {
      console.error('Error fetching good actions:', error);
      toast.error('Erreur lors du chargement des bonnes actions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoodActions();
  }, [user, activeTab]);

  const createGoodAction = async () => {
    if (!user || !newAction.title.trim()) return;

    try {
      const { error } = await supabase
        .from('good_actions')
        .insert({
          title: newAction.title,
          description: newAction.description,
          category: newAction.category || 'other',
          is_public: newAction.is_public,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Bonne action créée avec succès !');
      setIsCreateDialogOpen(false);
      setNewAction({ title: "", description: "", category: "", is_public: false });
      fetchGoodActions();
    } catch (error) {
      console.error('Error creating good action:', error);
      toast.error('Erreur lors de la création de la bonne action');
    }
  };

  const likeAction = async (actionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('good_action_likes')
        .insert({
          good_action_id: actionId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Bonne action likée !');
      fetchGoodActions();
    } catch (error) {
      console.error('Error liking action:', error);
      toast.error('Erreur lors du like');
    }
  };

  const filteredActions = goodActions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || action.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bonnes Actions</h1>
          <p className="text-muted-foreground">Partagez et découvrez des actions positives</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une bonne action</DialogTitle>
              <DialogDescription>
                Partagez une action positive que vous avez réalisée
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Titre de l'action"
                value={newAction.title}
                onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optionnelle)"
                value={newAction.description}
                onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
              />
              <Select 
                value={newAction.category} 
                onValueChange={(value) => setNewAction(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newAction.is_public}
                  onChange={(e) => setNewAction(prev => ({ ...prev, is_public: e.target.checked }))}
                />
                <label htmlFor="is_public" className="text-sm">
                  Rendre cette action publique
                </label>
              </div>
              <Button onClick={createGoodAction} className="w-full">
                Créer l'action
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-actions" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Mes actions
          </TabsTrigger>
          <TabsTrigger value="public-actions" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Actions publiques
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1">
            <Input
              placeholder="Rechercher des actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="my-actions" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune bonne action</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Commencez à documenter vos bonnes actions pour inspirer les autres.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre première action
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredActions.map((action) => (
                <Card key={action.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={action.user_profiles?.photo_url} />
                          <AvatarFallback>
                            {action.user_profiles?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            par {action.user_profiles?.display_name || 'Utilisateur anonyme'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{action.category}</Badge>
                        {action.is_public && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {action.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {action.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {action.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {action.comments_count || 0}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public-actions" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune action publique</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Il n'y a pas encore d'actions publiques à afficher.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredActions.map((action) => (
                <Card key={action.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={action.user_profiles?.photo_url} />
                          <AvatarFallback>
                            {action.user_profiles?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            par {action.user_profiles?.display_name || 'Utilisateur anonyme'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{action.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {action.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {action.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => likeAction(action.id)}
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {action.likes_count || 0}
                        </Button>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          {action.comments_count || 0}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
