import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Heart, 
  Calendar,
  Filter,
  Search,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Users,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/Sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import MobileHeader from "@/components/layout/MobileHeader";

interface GoodAction {
  id: string;
  title: string;
  description: string;
  category: string;
  impact_level: 'low' | 'medium' | 'high';
  date_performed: string;
  created_at: string;
  user_id: string;
}

const categories = [
  'Environnement',
  'Social',
  'Santé',
  'Éducation',
  'Famille',
  'Communauté',
  'Personnel',
  'Professionnel',
  'Autre'
];

const impactLevels = [
  { value: 'low', label: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'medium', label: 'Moyen', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'high', label: 'Élevé', color: 'bg-green-100 text-green-800 border-green-200' }
];

export default function GoodActions() {
  const [goodActions, setGoodActions] = useState<GoodAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<GoodAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<GoodAction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [impactLevel, setImpactLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [datePerformed, setDatePerformed] = useState(new Date().toISOString().split('T')[0]);

  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (user) {
      loadGoodActions();
    }
  }, [user]);

  useEffect(() => {
    filterActions();
  }, [goodActions, searchTerm, categoryFilter, impactFilter]);

  const filterActions = () => {
    let filtered = goodActions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(action => 
        action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(action => action.category === categoryFilter);
    }

    // Impact filter
    if (impactFilter !== 'all') {
      filtered = filtered.filter(action => action.impact_level === impactFilter);
    }

    setFilteredActions(filtered);
  };

  const loadGoodActions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('good_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('date_performed', { ascending: false });

      if (error) throw error;
      setGoodActions(data || []);
    } catch (error) {
      console.error('Error loading good actions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les bonnes actions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    try {
      const actionData = {
        title: title.trim(),
        description: description.trim(),
        category,
        impact_level: impactLevel,
        date_performed: datePerformed,
        user_id: user.id
      };

      if (editingAction) {
        const { error } = await supabase
          .from('good_actions')
          .update(actionData)
          .eq('id', editingAction.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({
          title: "Bonne action modifiée !",
          description: "Votre bonne action a été mise à jour avec succès.",
        });
      } else {
        const { error } = await supabase
          .from('good_actions')
          .insert(actionData);

        if (error) throw error;
        toast({
          title: "Bonne action ajoutée !",
          description: "Votre bonne action a été enregistrée avec succès.",
        });
      }

      resetForm();
      setIsCreateOpen(false);
      loadGoodActions();
    } catch (error) {
      console.error('Error saving good action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la bonne action.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setImpactLevel('medium');
    setDatePerformed(new Date().toISOString().split('T')[0]);
    setEditingAction(null);
  };

  const handleEdit = (action: GoodAction) => {
    setEditingAction(action);
    setTitle(action.title);
    setDescription(action.description);
    setCategory(action.category);
    setImpactLevel(action.impact_level);
    setDatePerformed(action.date_performed);
    setIsCreateOpen(true);
  };

  const handleDelete = async (actionId: string) => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cette bonne action ?')) return;

    try {
      const { error } = await supabase
        .from('good_actions')
        .delete()
        .eq('id', actionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoodActions(prev => prev.filter(action => action.id !== actionId));
      toast({
        title: "Bonne action supprimée",
        description: "La bonne action a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Error deleting good action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la bonne action.",
        variant: "destructive",
      });
    }
  };

  const getImpactLevelConfig = (level: string) => {
    return impactLevels.find(l => l.value === level) || impactLevels[1];
  };

  const getStats = () => {
    const totalActions = goodActions.length;
    const thisMonth = goodActions.filter(action => 
      new Date(action.date_performed).getMonth() === new Date().getMonth()
    ).length;
    const highImpact = goodActions.filter(action => action.impact_level === 'high').length;
    const uniqueCategories = new Set(goodActions.map(action => action.category)).size;

    return { totalActions, thisMonth, highImpact, uniqueCategories };
  };

  const stats = getStats();
  const sidebarContent = <Sidebar onItemClick={() => setSidebarOpen(false)} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? (
          <>
            <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
            <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <DrawerContent>
                {sidebarContent}
              </DrawerContent>
            </Drawer>
            <div className="pt-14 px-3 sm:px-6">
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Chargement...</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-screen w-full">
            {sidebarContent}
            <div className="flex-1 px-3 sm:px-6">
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Chargement...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
          <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <DrawerContent>
              {sidebarContent}
            </DrawerContent>
          </Drawer>
          <div className="pt-14 px-3 sm:px-6 pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Bonnes Actions</h1>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                  setIsCreateOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle bonne action
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        {editingAction ? 'Modifier la bonne action' : 'Nouvelle bonne action'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Titre de votre bonne action"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Décrivez votre bonne action..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Catégorie</Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="impact">Impact</Label>
                          <Select value={impactLevel} onValueChange={(value: 'low' | 'medium' | 'high') => setImpactLevel(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {impactLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={datePerformed}
                          onChange={(e) => setDatePerformed(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateOpen(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button type="submit" className="flex-1">
                          {editingAction ? 'Modifier' : 'Ajouter'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">{stats.totalActions}</p>
                      </div>
                      <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Ce mois</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.thisMonth}</p>
                      </div>
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Fort impact</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{stats.highImpact}</p>
                      </div>
                      <Star className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Catégories</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.uniqueCategories}</p>
                      </div>
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une bonne action..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={impactFilter} onValueChange={setImpactFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les impacts</SelectItem>
                        {impactLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Actions List */}
              <div className="space-y-4">
                {filteredActions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {goodActions.length === 0 ? 'Aucune bonne action enregistrée' : 'Aucune bonne action trouvée'}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {goodActions.length === 0 
                          ? 'Commencez par enregistrer votre première bonne action !'
                          : 'Essayez de modifier vos filtres pour voir d\'autres actions.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredActions.map((action) => {
                    const impactConfig = getImpactLevelConfig(action.impact_level);
                    return (
                      <Card key={action.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <CardTitle className="text-base sm:text-lg truncate">{action.title}</CardTitle>
                                <Badge className={impactConfig.color}>
                                  {impactConfig.label}
                                </Badge>
                                {action.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {action.category}
                                  </Badge>
                                )}
                              </div>
                              {action.description && (
                                <p className="text-muted-foreground text-sm break-words">{action.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
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
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(action.date_performed), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Ajoutée le {format(new Date(action.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-screen w-full">
          {sidebarContent}
          <div className="flex-1 px-3 sm:px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Desktop content - same structure as mobile but without pt-14 */}
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Bonnes Actions</h1>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                  setIsCreateOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle bonne action
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        {editingAction ? 'Modifier la bonne action' : 'Nouvelle bonne action'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Titre de votre bonne action"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Décrivez votre bonne action..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Catégorie</Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="impact">Impact</Label>
                          <Select value={impactLevel} onValueChange={(value: 'low' | 'medium' | 'high') => setImpactLevel(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {impactLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={datePerformed}
                          onChange={(e) => setDatePerformed(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateOpen(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button type="submit" className="flex-1">
                          {editingAction ? 'Modifier' : 'Ajouter'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">{stats.totalActions}</p>
                      </div>
                      <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Ce mois</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.thisMonth}</p>
                      </div>
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Fort impact</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{stats.highImpact}</p>
                      </div>
                      <Star className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Catégories</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.uniqueCategories}</p>
                      </div>
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une bonne action..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={impactFilter} onValueChange={setImpactFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les impacts</SelectItem>
                        {impactLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Actions List */}
              <div className="space-y-4">
                {filteredActions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {goodActions.length === 0 ? 'Aucune bonne action enregistrée' : 'Aucune bonne action trouvée'}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {goodActions.length === 0 
                          ? 'Commencez par enregistrer votre première bonne action !'
                          : 'Essayez de modifier vos filtres pour voir d\'autres actions.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredActions.map((action) => {
                    const impactConfig = getImpactLevelConfig(action.impact_level);
                    return (
                      <Card key={action.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <CardTitle className="text-base sm:text-lg truncate">{action.title}</CardTitle>
                                <Badge className={impactConfig.color}>
                                  {impactConfig.label}
                                </Badge>
                                {action.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {action.category}
                                  </Badge>
                                )}
                              </div>
                              {action.description && (
                                <p className="text-muted-foreground text-sm break-words">{action.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
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
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(action.date_performed), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Ajoutée le {format(new Date(action.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
