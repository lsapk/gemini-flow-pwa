import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Shield,
  Users,
  Search,
  Ban,
  UserCheck,
  Trophy,
  Target,
  CheckSquare,
  Timer,
  Sparkles,
  RefreshCw,
  Eye,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_banned: boolean;
}

interface UserStats {
  tasks_completed: number;
  habits_count: number;
  goals_count: number;
  focus_minutes: number;
  level: number;
  xp: number;
  credits: number;
}

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<UserData | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email.toLowerCase().includes(query) ||
            (u.display_name && u.display_name.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get banned users
      const { data: bannedUsers, error: bannedError } = await supabase
        .from("banned_users")
        .select("user_id");

      if (bannedError) throw bannedError;

      const bannedIds = new Set(bannedUsers?.map((b) => b.user_id) || []);

      const usersWithBanStatus: UserData[] = (profiles || []).map((p) => ({
        id: p.id,
        email: p.email || "",
        display_name: p.display_name,
        created_at: p.created_at,
        is_banned: bannedIds.has(p.id),
      }));

      setUsers(usersWithBanStatus);
      setFilteredUsers(usersWithBanStatus);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    setStatsLoading(true);
    try {
      const [tasksRes, habitsRes, goalsRes, focusRes, profileRes] = await Promise.allSettled([
        supabase.from("tasks").select("id").eq("user_id", userId).eq("completed", true),
        supabase.from("habits").select("id").eq("user_id", userId),
        supabase.from("goals").select("id").eq("user_id", userId),
        supabase.from("focus_sessions").select("duration").eq("user_id", userId),
        supabase.from("player_profiles").select("level, experience_points, credits").eq("user_id", userId).single(),
      ]);

      const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.data?.length || 0 : 0;
      const habits = habitsRes.status === "fulfilled" ? habitsRes.value.data?.length || 0 : 0;
      const goals = goalsRes.status === "fulfilled" ? goalsRes.value.data?.length || 0 : 0;
      const focusSessions = focusRes.status === "fulfilled" ? focusRes.value.data || [] : [];
      const playerProfile = profileRes.status === "fulfilled" ? profileRes.value.data : null;

      const totalMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

      setUserStats({
        tasks_completed: tasks,
        habits_count: habits,
        goals_count: goals,
        focus_minutes: totalMinutes,
        level: playerProfile?.level || 1,
        xp: playerProfile?.experience_points || 0,
        credits: playerProfile?.credits || 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleViewUser = (userData: UserData) => {
    setSelectedUser(userData);
    setUserStats(null);
    fetchUserStats(userData.id);
  };

  const handleBanUser = async () => {
    if (!userToBan || !user) return;

    try {
      const { error } = await supabase.from("banned_users").insert({
        user_id: userToBan.id,
        banned_by: user.id,
        reason: banReason || null,
      });

      if (error) throw error;

      toast.success(`${userToBan.email} a été banni`);
      setBanDialogOpen(false);
      setUserToBan(null);
      setBanReason("");
      fetchUsers();
    } catch (error: any) {
      console.error("Error banning user:", error);
      toast.error("Erreur lors du bannissement");
    }
  };

  const handleUnbanUser = async (userData: UserData) => {
    try {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("user_id", userData.id);

      if (error) throw error;

      toast.success(`${userData.email} a été débanni`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error unbanning user:", error);
      toast.error("Erreur lors du débannissement");
    }
  };

  const openBanDialog = (userData: UserData) => {
    setUserToBan(userData);
    setBanDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground text-sm">Gérer les utilisateurs et les accès</p>
        </div>
        <Badge className="ml-auto bg-red-500/10 text-red-500 border-red-500/20">
          Admin
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{users.filter((u) => !u.is_banned).length}</div>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{users.filter((u) => u.is_banned).length}</div>
            <p className="text-xs text-muted-foreground">Bannis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">∞</div>
            <p className="text-xs text-muted-foreground">Crédits Admin</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Users List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs
              </CardTitle>
              <CardDescription>Liste de tous les utilisateurs enregistrés</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredUsers.map((userData) => (
                  <div
                    key={userData.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      userData.is_banned
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-muted/30 border-border/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                          userData.is_banned
                            ? "bg-red-500"
                            : "bg-gradient-to-br from-primary to-primary/60"
                        }`}
                      >
                        {userData.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{userData.email}</span>
                          {userData.is_banned && (
                            <Badge variant="destructive" className="text-xs">
                              Banni
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {userData.display_name || "Sans nom"} • Inscrit le{" "}
                          {new Date(userData.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewUser(userData)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {userData.is_banned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(userData)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBanDialog(userData)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                  selectedUser?.is_banned
                    ? "bg-red-500"
                    : "bg-gradient-to-br from-primary to-primary/60"
                }`}
              >
                {selectedUser?.email.charAt(0).toUpperCase()}
              </div>
              {selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name || "Sans nom"} • Membre depuis le{" "}
              {selectedUser && new Date(selectedUser.created_at).toLocaleDateString("fr-FR")}
            </DialogDescription>
          </DialogHeader>

          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : userStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <CheckSquare className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold">{userStats.tasks_completed}</div>
                  <p className="text-xs text-muted-foreground">Tâches</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{userStats.habits_count}</div>
                  <p className="text-xs text-muted-foreground">Habitudes</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-lg font-bold">{userStats.goals_count}</div>
                  <p className="text-xs text-muted-foreground">Objectifs</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Timer className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <div className="text-lg font-bold">{Math.round(userStats.focus_minutes / 60)}h</div>
                  <p className="text-xs text-muted-foreground">Focus</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Niveau {userStats.level}</p>
                    <p className="text-xs text-muted-foreground">{userStats.xp} XP total</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-bold">{userStats.credits}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">crédits</p>
                  </div>
                </div>
              </div>

              {selectedUser?.is_banned && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <Ban className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <p className="text-sm font-medium text-red-500">Utilisateur banni</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bannir cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir bannir {userToBan?.email} ? Cette action peut être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              placeholder="Raison du bannissement (optionnel)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason("")}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Bannir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
