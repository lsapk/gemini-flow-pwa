
import { useState, useEffect } from "react";
import { Plus, Heart, MessageCircle, Edit2, Trash2, Calendar, Users, TrendingUp, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  getPublicGoodActions, 
  getUserGoodActions, 
  createGoodAction, 
  deleteGoodAction,
  addGoodActionLike,
  removeGoodActionLike,
  hasUserLikedGoodAction 
} from "@/lib/goodActionsApi";
import { GoodAction } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import MobileHeader from "@/components/layout/MobileHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function GoodActions() {
  const [goodActions, setGoodActions] = useState<GoodAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<GoodAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'public' | 'personal'>('public');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [likedActions, setLikedActions] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    is_public: true,
    impact_level: 'medium' as 'low' | 'medium' | 'high',
    date_performed: new Date().toISOString().split('T')[0]
  });

  const fetchGoodActions = async () => {
    try {
      setIsLoading(true);
      
      let actions: GoodAction[] = [];
      if (viewMode === 'public') {
        actions = await getPublicGoodActions();
      } else if (user) {
        actions = await getUserGoodActions(user.id);
      }

      // Transform data to match GoodAction type
      const transformedActions: GoodAction[] = actions.map(action => ({
        ...action,
        impact_level: action.impact_level || 'medium',
        date_performed: action.date_performed || action.created_at
      }));

      setGoodActions(transformedActions);
      setFilteredActions(transformedActions);

      // Check liked actions for current user
      if (user && viewMode === 'public') {
        const likedSet = new Set<string>();
        for (const action of transformedActions) {
          const isLiked = await hasUserLikedGoodAction(action.id);
          if (isLiked) {
            likedSet.add(action.id);
          }
        }
        setLikedActions(likedSet);
      }
    } catch (error) {
      console.error('Error fetching good actions:', error);
      toast.error('Erreur lors du chargement des bonnes actions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoodActions();
  }, [viewMode, user]);

  useEffect(() => {
    let filtered = goodActions;

    if (searchTerm) {
      filtered = filtered.filter(action => 
        action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(action => action.category === selectedCategory);
    }

    setFilteredActions(filtered);
  }, [searchTerm, selectedCategory, goodActions]);

  const handleCreateAction = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour créer une bonne action');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      await createGoodAction({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        is_public: formData.is_public
      });

      toast.success('Bonne action créée avec succès !');
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        is_public: true,
        impact_level: 'medium',
        date_performed: new Date().toISOString().split('T')[0]
      });
      fetchGoodActions();
    } catch (error) {
      console.error('Error creating good action:', error);
      toast.error('Erreur lors de la création de la bonne action');
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await deleteGoodAction(actionId);
      toast.success('Bonne action supprimée');
      fetchGoodActions();
    } catch (error) {
      console.error('Error deleting good action:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleLikeAction = async (actionId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour liker');
      return;
    }

    try {
      const isCurrentlyLiked = likedActions.has(actionId);
      
      if (isCurrentlyLiked) {
        await removeGoodActionLike(actionId);
        setLikedActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
      } else {
        await addGoodActionLike(actionId);
        setLikedActions(prev => new Set(prev).add(actionId));
      }

      // Update the action's like count locally
      setGoodActions(prev => prev.map(action => 
        action.id === actionId 
          ? { 
              ...action, 
              likes_count: isCurrentlyLiked 
                ? action.likes_count - 1 
                : action.likes_count + 1
            }
          : action
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur lors du like');
    }
  };

  const getImpactColor = (level?: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactLabel = (level?: string) => {
    switch (level) {
      case 'high': return 'Fort impact';
      case 'medium': return 'Impact moyen';
      case 'low': return 'Faible impact';
      default: return 'Impact moyen';
    }
  };

  const categories = [...new Set(goodActions.map(action => action.category))].filter(Boolean);

  // Stats calculations
  const totalActions = goodActions.length;
  const thisMonthActions = goodActions.filter(action => {
    const actionDate = new Date(action.created_at);
    const now = new Date();
    return actionDate.getMonth() === now.getMonth() && actionDate.getFullYear() === now.getFullYear();
  }).length;
  const highImpactActions = goodActions.filter(action => action.impact_level === 'high').length;
  const uniqueCategories = categories.length;

  const sidebarContent = <Sidebar onItemClick={() => setSidebarOpen(false)} />;

  const renderStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total</p>
              <p className="text-2xl font-bold">{totalActions}</p>
            </div>
            <Heart className="h-8 w-8 text-red-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Ce mois</p>
              <p className="text-2xl font-bold">{thisMonthActions}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Fort impact</p>
              <p className="text-2xl font-bold">{highImpactActions}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Catégories</p>
              <p className="text-2xl font-bold">{uniqueCategories}</p>
            </div>
            <Users className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {renderStats()}
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'public' ? 'default' : 'outline'}
            onClick={() => setViewMode('public')}
            size="sm"
          >
            Communauté
          </Button>
          <Button
            variant={viewMode === 'personal' ? 'default' : 'outline'}
            onClick={() => setViewMode('personal')}
            size="sm"
          >
            Mes actions
          </Button>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle bonne action
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une bonne action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: J'ai aidé une personne âgée"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre bonne action..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Famille, Travail, Environnement..."
                />
              </div>

              <div>
                <Label htmlFor="impact_level">Niveau d'impact</Label>
                <Select
                  value={formData.impact_level}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setFormData(prev => ({ ...prev, impact_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible impact</SelectItem>
                    <SelectItem value="medium">Impact moyen</SelectItem>
                    <SelectItem value="high">Fort impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date_performed">Date de réalisation</Label>
                <Input
                  id="date_performed"
                  type="date"
                  value={formData.date_performed}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_performed: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
                <Label htmlFor="is_public">Partager avec la communauté</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateAction} className="flex-1">
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher une bonne action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:gap-6">
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
            <h3 className="text-lg font-semibold mb-2">
              {viewMode === 'personal' ? 'Aucune bonne action personnelle' : 'Aucune bonne action trouvée'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {viewMode === 'personal' 
                ? 'Commencez à créer vos premières bonnes actions !'
                : 'Aucune bonne action ne correspond à vos critères de recherche.'
              }
            </p>
            {viewMode === 'personal' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première bonne action
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {filteredActions.map((action) => (
            <Card key={action.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg text-red-700">{action.title}</CardTitle>
                      <Badge className={`${getImpactColor(action.impact_level)} text-white`}>
                        {getImpactLabel(action.impact_level)}
                      </Badge>
                    </div>
                    {action.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(action.date_performed || action.created_at).toLocaleDateString()}
                      </span>
                      {action.user_profiles?.display_name && (
                        <span>Par {action.user_profiles.display_name}</span>
                      )}
                      {action.category && (
                        <Badge variant="secondary" className="text-xs">
                          {action.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {viewMode === 'personal' && user && action.user_id === user.id && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAction(action.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeAction(action.id)}
                      className={`flex items-center gap-2 ${
                        likedActions.has(action.id) ? 'text-red-600' : 'text-muted-foreground'
                      } hover:text-red-600`}
                    >
                      <Heart className={`h-4 w-4 ${likedActions.has(action.id) ? 'fill-current' : ''}`} />
                      {action.likes_count}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {action.comments_count}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Ajoutée le {new Date(action.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <DrawerContent>
            {sidebarContent}
          </DrawerContent>
        </Drawer>
        <div className="pt-14 px-3 sm:px-6 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="h-6 w-6 text-red-500" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bonnes Actions</h1>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {sidebarContent}
      <div className="flex-1 px-3 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bonnes Actions</h1>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
