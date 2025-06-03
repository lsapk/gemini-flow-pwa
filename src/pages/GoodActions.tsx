
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isAdminModeEnabled } from "@/lib/api";
import { 
  getAllPublicGoodActions, 
  getUserGoodActions, 
  createGoodAction, 
  updateGoodAction, 
  deleteGoodAction,
  likeGoodAction,
  checkUserLike,
  addComment,
  getComments,
  deleteComment,
  moderateComment
} from "@/lib/goodActionsApi";
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Edit,
  Trash2,
  Users,
  User,
  Filter,
  Send,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { GoodAction, GoodActionComment } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function GoodActions() {
  const [publicActions, setPublicActions] = useState<GoodAction[]>([]);
  const [userActions, setUserActions] = useState<GoodAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<GoodAction[]>([]);
  const [comments, setComments] = useState<{ [key: string]: GoodActionComment[] }>({});
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('community');
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState<GoodAction | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    is_public: true
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const categories = [
    'Écologie', 'Entraide', 'Santé', 'Éducation', 'Sport', 
    'Créativité', 'Travail', 'Famille', 'Communauté', 'Autre'
  ];

  useEffect(() => {
    if (user) {
      setIsAdmin(isAdminModeEnabled());
      loadData();
    }
  }, [user]);

  useEffect(() => {
    filterActions();
  }, [publicActions, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [publicData, userData] = await Promise.all([
        getAllPublicGoodActions(),
        getUserGoodActions()
      ]);
      
      setPublicActions(publicData);
      setUserActions(userData);
      
      // Charger les likes de l'utilisateur
      const likes: { [key: string]: boolean } = {};
      for (const action of publicData) {
        likes[action.id] = await checkUserLike(action.id);
      }
      setUserLikes(likes);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les bonnes actions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterActions = () => {
    let actions = publicActions;
    
    if (filter !== 'all') {
      actions = actions.filter(action => action.category === filter);
    }
    
    setFilteredActions(actions);
  };

  const loadComments = async (actionId: string) => {
    try {
      const actionComments = await getComments(actionId);
      setComments(prev => ({ ...prev, [actionId]: actionComments }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async (actionId: string) => {
    try {
      const liked = await likeGoodAction(actionId);
      setUserLikes(prev => ({ ...prev, [actionId]: liked }));
      
      // Mettre à jour le compteur localement
      setPublicActions(prev => prev.map(action => 
        action.id === actionId 
          ? { ...action, likes_count: action.likes_count + (liked ? 1 : -1) }
          : action
      ));
      
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le like.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (actionId: string) => {
    const content = newComment[actionId]?.trim();
    if (!content) return;

    try {
      await addComment(actionId, content);
      setNewComment(prev => ({ ...prev, [actionId]: '' }));
      
      // Recharger les commentaires
      await loadComments(actionId);
      
      // Mettre à jour le compteur
      setPublicActions(prev => prev.map(action => 
        action.id === actionId 
          ? { ...action, comments_count: action.comments_count + 1 }
          : action
      ));
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string, actionId: string) => {
    try {
      await deleteComment(commentId);
      await loadComments(actionId);
      
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire.",
        variant: "destructive",
      });
    }
  };

  const handleModerateComment = async (commentId: string, actionId: string) => {
    try {
      await moderateComment(commentId);
      await loadComments(actionId);
      
      toast({
        title: "Commentaire modéré",
        description: "Le commentaire a été supprimé par modération.",
      });
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modérer le commentaire.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    try {
      if (editingAction) {
        await updateGoodAction(editingAction.id, formData);
        toast({
          title: "Bonne action modifiée",
          description: "Votre bonne action a été mise à jour avec succès.",
        });
      } else {
        await createGoodAction(formData);
        toast({
          title: "Bonne action créée",
          description: "Votre bonne action a été publiée avec succès.",
        });
      }
      
      setFormData({ title: '', description: '', category: '', is_public: true });
      setEditingAction(null);
      setIsCreateOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la bonne action.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (action: GoodAction) => {
    setFormData({
      title: action.title,
      description: action.description || '',
      category: action.category,
      is_public: action.is_public
    });
    setEditingAction(action);
    setIsCreateOpen(true);
  };

  const handleDelete = async (actionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bonne action ?')) return;

    try {
      await deleteGoodAction(actionId);
      setUserActions(prev => prev.filter(a => a.id !== actionId));
      setPublicActions(prev => prev.filter(a => a.id !== actionId));
      
      toast({
        title: "Bonne action supprimée",
        description: "La bonne action a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la bonne action.",
        variant: "destructive",
      });
    }
  };

  const ActionCard = ({ action, showUserActions = false }: { action: GoodAction; showUserActions?: boolean }) => (
    <Card key={action.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                  {action.user_profiles?.display_name?.[0] || action.user_profiles?.email?.[0] || 'U'}
                </div>
                <span className="font-medium text-sm">
                  {action.user_profiles?.display_name || action.user_profiles?.email || 'Utilisateur'}
                </span>
              </div>
              <Badge variant="outline">{action.category}</Badge>
              {!action.is_public && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Privé
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{action.title}</CardTitle>
            {action.description && (
              <p className="text-muted-foreground mt-2">{action.description}</p>
            )}
          </div>
          
          {showUserActions && user?.id === action.user_id && (
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(action)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(action.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 ${userLikes[action.id] ? 'text-red-500' : ''}`}
              onClick={() => handleLike(action.id)}
            >
              <Heart className={`h-4 w-4 ${userLikes[action.id] ? 'fill-current' : ''}`} />
              <span>{action.likes_count}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => loadComments(action.id)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{action.comments_count}</span>
            </Button>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {format(new Date(action.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
          </span>
        </div>

        {/* Commentaires */}
        {comments[action.id] && (
          <div className="border-t pt-4 space-y-3">
            {comments[action.id].map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {comment.user_profiles?.display_name?.[0] || comment.user_profiles?.email?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.user_profiles?.display_name || comment.user_profiles?.email || 'Utilisateur'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>
                    
                    {/* Actions sur commentaires */}
                    <div className="flex items-center gap-1 ml-auto">
                      {user?.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteComment(comment.id, action.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() => handleModerateComment(comment.id, action.id)}
                        >
                          <Shield className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
            
            {/* Formulaire d'ajout de commentaire */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Ajouter un commentaire..."
                value={newComment[action.id] || ''}
                onChange={(e) => setNewComment(prev => ({ ...prev, [action.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment(action.id);
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleComment(action.id)}
                disabled={!newComment[action.id]?.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6" />
          <h1 className="text-2xl sm:text-3xl font-bold">Bonnes Actions</h1>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle bonne action
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAction ? 'Modifier la bonne action' : 'Créer une nouvelle bonne action'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de votre bonne action"
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
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
                <Label htmlFor="is_public" className="flex items-center gap-2">
                  {formData.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {formData.is_public ? 'Publique (visible par tous)' : 'Privée (visible par vous seulement)'}
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingAction ? 'Modifier' : 'Créer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingAction(null);
                    setFormData({ title: '', description: '', category: '', is_public: true });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Communauté
          </TabsTrigger>
          <TabsTrigger value="my-actions" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mes Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtrer par catégorie :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={filter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions publiques */}
          <div>
            {filteredActions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Aucune bonne action trouvée</p>
                  <p className="text-muted-foreground">
                    Soyez le premier à partager une bonne action avec la communauté !
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredActions.map(action => (
                <ActionCard key={action.id} action={action} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-actions" className="space-y-4">
          {userActions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Aucune bonne action créée</p>
                <p className="text-muted-foreground mb-4">
                  Commencez par créer votre première bonne action !
                </p>
              </CardContent>
            </Card>
          ) : (
            userActions.map(action => (
              <ActionCard key={action.id} action={action} showUserActions />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
