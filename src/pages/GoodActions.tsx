
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, Heart, Users, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  GoodAction,
  getPublicGoodActions as getAllPublicGoodActions,
  getUserGoodActions,
  createGoodAction,
  deleteGoodActionById as deleteGoodAction,
  addGoodActionLike as likeGoodAction,
  removeGoodActionLike,
  hasUserLikedGoodAction as checkUserLike
} from "@/lib/goodActionsApi";
import { GoodActionCard } from "@/components/GoodActionCard";

export default function GoodActions() {
  const [goodActions, setGoodActions] = useState<GoodAction[]>([]);
  const [userGoodActions, setUserGoodActions] = useState<GoodAction[]>([]);
  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    category: "environnement",
    is_public: true,
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadGoodActions();
  }, [user]);

  const loadGoodActions = async () => {
    setLoading(true);
    try {
      const publicActions = await getAllPublicGoodActions();
      setGoodActions(publicActions);

      if (user) {
        const userActions = await getUserGoodActions(user.id);
        setUserGoodActions(userActions);
      }
    } catch (error: any) {
      toast.error(
        "Erreur lors du chargement des bonnes actions: " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAction({ ...newAction, [e.target.name]: e.target.value });
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewAction({ ...newAction, description: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setNewAction({ ...newAction, category: value });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAction({ ...newAction, is_public: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté pour créer une bonne action.");
      return;
    }

    try {
      await createGoodAction(newAction);
      toast.success("Bonne action créée avec succès!");
      setNewAction({
        title: "",
        description: "",
        category: "environnement",
        is_public: true,
      });
      await loadGoodActions();
    } catch (error: any) {
      toast.error("Erreur lors de la création de la bonne action: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoodAction(id);
      toast.success("Bonne action supprimée avec succès!");
      await loadGoodActions();
    } catch (error: any) {
      toast.error(
        "Erreur lors de la suppression de la bonne action: " + error.message
      );
    }
  };

  const handleLike = async (action: GoodAction) => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer cette action.");
      return;
    }

    try {
      const hasLiked = await checkUserLike(action.id);
      if (hasLiked) {
        await removeGoodActionLike(action.id);
        toast.success("Vous n'aimez plus cette action.");
      } else {
        await likeGoodAction(action.id);
        toast.success("Vous aimez cette action!");
      }
      await loadGoodActions();
    } catch (error: any) {
      toast.error("Erreur lors de l'opération: " + error.message);
    }
  };

  const filteredActions = goodActions.filter((action) => {
    const categoryMatch =
      categoryFilter === "all" || action.category === categoryFilter;
    const searchMatch =
      searchQuery === "" ||
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement des bonnes actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Partage de Bonnes Actions
        </h1>
        <Button onClick={() => {}}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une Action
        </Button>
      </div>

      {/* Section de recherche et de filtrage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Rechercher une action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 ml-2" />
        </div>
        <Select onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="environnement">Environnement</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="sante">Santé</SelectItem>
            <SelectItem value="education">Éducation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Section d'ajout d'une bonne action */}
      <Card>
        <CardHeader>
          <CardTitle>Proposer une nouvelle bonne action</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={newAction.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={newAction.description}
                onChange={handleTextAreaChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="environnement">Environnement</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="sante">Santé</SelectItem>
                  <SelectItem value="education">Éducation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="is_public">Action publique ?</Label>
              <Switch
                id="is_public"
                checked={newAction.is_public}
                onCheckedChange={(checked) =>
                  setNewAction({ ...newAction, is_public: checked })
                }
              />
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Affichage des bonnes actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActions.map((action) => (
          <GoodActionCard
            key={action.id}
            goodAction={action}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
