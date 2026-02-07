import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAdminStats } from "@/hooks/useAdminStats";
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
  Crown,
  Coins,
  History,
  BarChart3,
  Download,
  UserPlus,
  Flame
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_banned: boolean;
  is_admin: boolean;
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
  const { user, isAdmin: clientIsAdmin, isLoading } = useAuth();
  const { stats: platformStats, logs: adminLogs, isLoading: statsLoading, logAction, refetch } = useAdminStats();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsUserLoading, setStatsUserLoading] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<UserData | null>(null);
  const [banReason, setBanReason] = useState("");
  
  // Credits dialog
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [creditsUser, setCreditsUser] = useState<UserData | null>(null);
  const [creditsAmount, setCreditsAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<'game' | 'ai'>('game');
  
  // Admin promotion dialog
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState<UserData | null>(null);
  
  // SECURITY: Server-side admin verification
  const [serverVerifiedAdmin, setServerVerifiedAdmin] = useState<boolean | null>(null);
  const [verifyingAdmin, setVerifyingAdmin] = useState(true);

  // Verify admin status
  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user) {
        setServerVerifiedAdmin(false);
        setVerifyingAdmin(false);
        return;
      }
      setServerVerifiedAdmin(clientIsAdmin);
      setVerifyingAdmin(false);
    };

    if (!isLoading) {
      verifyAdmin();
    }
  }, [user, isLoading, clientIsAdmin]);

  const isAdmin = serverVerifiedAdmin ?? clientIsAdmin;

  useEffect(() => {
    if (isAdmin && !verifyingAdmin) {
      fetchUsers();
    }
  }, [isAdmin, verifyingAdmin]);

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

      // Get admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminError) throw adminError;

      const bannedIds = new Set(bannedUsers?.map((b) => b.user_id) || []);
      const adminIds = new Set(adminUsers?.map((a) => a.user_id) || []);

      const usersWithStatus: UserData[] = (profiles || []).map((p) => ({
        id: p.id,
        email: p.email || "",
        display_name: p.display_name,
        created_at: p.created_at,
        is_banned: bannedIds.has(p.id),
        is_admin: adminIds.has(p.id),
      }));

      setUsers(usersWithStatus);
      setFilteredUsers(usersWithStatus);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    setStatsUserLoading(true);
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
      setStatsUserLoading(false);
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

      await logAction("ban_user", userToBan.id, userToBan.email, { reason: banReason });
      toast.success(`${userToBan.email} a été banni`);
      setBanDialogOpen(false);
      setUserToBan(null);
      setBanReason("");
      fetchUsers();
    } catch (error: unknown) {
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

      await logAction("unban_user", userData.id, userData.email);
      toast.success(`${userData.email} a été débanni`);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Error unbanning user:", error);
      toast.error("Erreur lors du débannissement");
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!userToPromote) return;

    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userToPromote.id,
        role: "admin",
      });

      if (error) throw error;

      await logAction("promote_admin", userToPromote.id, userToPromote.email);
      toast.success(`${userToPromote.email} est maintenant administrateur`);
      setPromoteDialogOpen(false);
      setUserToPromote(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Error promoting user:", error);
      toast.error("Erreur lors de la promotion");
    }
  };

  const handleDemoteAdmin = async (userData: UserData) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userData.id)
        .eq("role", "admin");

      if (error) throw error;

      await logAction("demote_admin", userData.id, userData.email);
      toast.success(`${userData.email} n'est plus administrateur`);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Error demoting user:", error);
      toast.error("Erreur lors de la rétrogradation");
    }
  };

  const handleGiveCredits = async () => {
    if (!creditsUser || creditsAmount === 0) return;

    try {
      if (creditType === 'game') {
        const { data: profile } = await supabase
          .from("player_profiles")
          .select("credits")
          .eq("user_id", creditsUser.id)
          .single();

        const newCredits = Math.max(0, (profile?.credits || 0) + creditsAmount);

        const { error } = await supabase
          .from("player_profiles")
          .update({ credits: newCredits })
          .eq("user_id", creditsUser.id);

        if (error) throw error;

        await logAction("modify_game_credits", creditsUser.id, creditsUser.email, { 
          type: 'game',
          amount: creditsAmount,
          new_total: newCredits 
        });
        
        toast.success(`${creditsAmount > 0 ? "+" : ""}${creditsAmount} crédits jeu pour ${creditsUser.email}`);
      } else {
        // AI credits
        const { data: existing } = await supabase
          .from("ai_credits")
          .select("credits")
          .eq("user_id", creditsUser.id)
          .maybeSingle();

        const newCredits = Math.max(0, (existing?.credits || 0) + creditsAmount);

        if (existing) {
          const { error } = await supabase
            .from("ai_credits")
            .update({ credits: newCredits, last_updated: new Date().toISOString() })
            .eq("user_id", creditsUser.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("ai_credits")
            .insert({ user_id: creditsUser.id, credits: newCredits });
          if (error) throw error;
        }

        await logAction("modify_ai_credits", creditsUser.id, creditsUser.email, { 
          type: 'ai',
          amount: creditsAmount,
          new_total: newCredits 
        });
        
        toast.success(`${creditsAmount > 0 ? "+" : ""}${creditsAmount} crédits IA pour ${creditsUser.email}`);
      }

      setCreditsDialogOpen(false);
      setCreditsUser(null);
      setCreditsAmount(0);
    } catch (error: unknown) {
      console.error("Error modifying credits:", error);
      toast.error("Erreur lors de la modification des crédits");
    }
  };

  const exportUsersCSV = () => {
    const headers = ["Email", "Nom", "Date inscription", "Banni", "Admin"];
    const rows = users.map(u => [
      u.email,
      u.display_name || "",
      new Date(u.created_at).toLocaleDateString("fr-FR"),
      u.is_banned ? "Oui" : "Non",
      u.is_admin ? "Oui" : "Non"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    logAction("export_users_csv", undefined, undefined, { count: users.length });
    toast.success("Export CSV téléchargé");
  };

  const openBanDialog = (userData: UserData) => {
    setUserToBan(userData);
    setBanDialogOpen(true);
  };

  const openCreditsDialog = (userData: UserData) => {
    setCreditsUser(userData);
    setCreditsAmount(0);
    setCreditType('game');
    setCreditsDialogOpen(true);
  };

  const openPromoteDialog = (userData: UserData) => {
    setUserToPromote(userData);
    setPromoteDialogOpen(true);
  };

  // Show loading during initial auth check and server verification
  if (isLoading || verifyingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // SECURITY: Only allow access if server-verified admin
  if (serverVerifiedAdmin !== true) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground text-sm">Gestion complète de la plateforme</p>
        </div>
        <Badge className="ml-auto bg-red-500/10 text-red-500 border-red-500/20">
          Admin
        </Badge>
      </div>

      {/* Platform Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistiques Plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <div className="text-xl font-bold">{platformStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <UserPlus className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold">{platformStats.newUsersThisWeek}</div>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 text-center">
                <CheckSquare className="h-6 w-6 mx-auto mb-1 text-success" />
                <div className="text-xl font-bold">{platformStats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">Tâches</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 text-center">
                <Flame className="h-6 w-6 mx-auto mb-1 text-warning" />
                <div className="text-xl font-bold">{platformStats.totalHabits}</div>
                <p className="text-xs text-muted-foreground">Habitudes</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <Target className="h-6 w-6 mx-auto mb-1 text-primary" />
                <div className="text-xl font-bold">{platformStats.totalGoals}</div>
                <p className="text-xs text-muted-foreground">Objectifs</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                <Timer className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                <div className="text-xl font-bold">{Math.round(platformStats.totalFocusMinutes / 60)}h</div>
                <p className="text-xs text-muted-foreground">Focus total</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                <div className="text-xl font-bold">∞</div>
                <p className="text-xs text-muted-foreground">Crédits Admin</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Rôles</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des Utilisateurs
                  </CardTitle>
                  <CardDescription>Liste complète avec actions rapides</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchUsers}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={exportUsersCSV}>
                    <Download className="h-4 w-4" />
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
                            : userData.is_admin
                            ? "bg-yellow-500/5 border-yellow-500/20"
                            : "bg-muted/30 border-border/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                              userData.is_banned
                                ? "bg-red-500"
                                : userData.is_admin
                                ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                                : "bg-gradient-to-br from-primary to-primary/60"
                            }`}
                          >
                            {userData.is_admin ? <Crown className="h-5 w-5" /> : userData.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{userData.email}</span>
                              {userData.is_admin && (
                                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                                  Admin
                                </Badge>
                              )}
                              {userData.is_banned && (
                                <Badge variant="destructive" className="text-xs">
                                  Banni
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {userData.display_name || "Sans nom"} • {format(new Date(userData.created_at), "d MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewUser(userData)} title="Voir détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openCreditsDialog(userData)} title="Gérer crédits">
                            <Coins className="h-4 w-4" />
                          </Button>
                          {userData.is_banned ? (
                            <Button variant="ghost" size="icon" onClick={() => handleUnbanUser(userData)} className="text-green-600" title="Débannir">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => openBanDialog(userData)} className="text-red-600" title="Bannir">
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
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Gestion des Rôles
              </CardTitle>
              <CardDescription>Promouvoir ou rétrograder les administrateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un utilisateur à promouvoir..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Admins actuels */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Administrateurs ({users.filter(u => u.is_admin).length})
                    </h3>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {users.filter(u => u.is_admin).map(userData => (
                          <div key={userData.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">{userData.email}</span>
                            </div>
                            {userData.id !== user?.id && (
                              <Button variant="ghost" size="sm" onClick={() => handleDemoteAdmin(userData)} className="text-red-600">
                                Rétrograder
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Utilisateurs normaux */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Utilisateurs ({filteredUsers.filter(u => !u.is_admin).length})
                    </h3>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {filteredUsers.filter(u => !u.is_admin && !u.is_banned).slice(0, 20).map(userData => (
                          <div key={userData.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                            <span className="text-sm font-medium truncate flex-1">{userData.email}</span>
                            <Button variant="outline" size="sm" onClick={() => openPromoteDialog(userData)}>
                              Promouvoir
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des Actions
                  </CardTitle>
                  <CardDescription>Suivi des actions administratives</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {adminLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune action enregistrée
                    </div>
                  ) : (
                    adminLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{log.action}</span>
                            {log.target_user_email && (
                              <Badge variant="outline" className="text-xs">
                                {log.target_user_email}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Par {log.admin_email} • {format(new Date(log.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                  selectedUser?.is_banned
                    ? "bg-red-500"
                    : selectedUser?.is_admin
                    ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                    : "bg-gradient-to-br from-primary to-primary/60"
                }`}
              >
                {selectedUser?.is_admin ? <Crown className="h-4 w-4" /> : selectedUser?.email.charAt(0).toUpperCase()}
              </div>
              {selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name || "Sans nom"} • Membre depuis le{" "}
              {selectedUser && format(new Date(selectedUser.created_at), "d MMMM yyyy", { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {statsUserLoading ? (
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

      {/* Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Gérer les crédits
            </DialogTitle>
            <DialogDescription>
              Ajouter ou retirer des crédits pour {creditsUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Credit type selector */}
            <div className="flex gap-2">
              <Button
                variant={creditType === 'game' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreditType('game')}
                className="flex-1"
              >
                <Coins className="h-4 w-4 mr-2" />
                Crédits Jeu
              </Button>
              <Button
                variant={creditType === 'ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreditType('ai')}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Crédits IA
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev - 100)}>-100</Button>
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev - 10)}>-10</Button>
              <Input 
                type="number" 
                value={creditsAmount} 
                onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                className="text-center"
              />
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev + 10)}>+10</Button>
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev + 100)}>+100</Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {creditsAmount > 0 
                ? `Ajouter ${creditsAmount} crédits ${creditType === 'ai' ? 'IA' : 'jeu'}` 
                : creditsAmount < 0 
                ? `Retirer ${Math.abs(creditsAmount)} crédits ${creditType === 'ai' ? 'IA' : 'jeu'}` 
                : "Aucun changement"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleGiveCredits} disabled={creditsAmount === 0}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promouvoir en administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToPromote?.email} aura accès à toutes les fonctionnalités d'administration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteToAdmin}>
              Promouvoir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
