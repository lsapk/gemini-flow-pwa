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
  Shield, Users, Search, Ban, UserCheck, Trophy, Target,
  CheckSquare, Timer, Sparkles, RefreshCw, Eye, Crown,
  Coins, History, BarChart3, Download, UserPlus, Flame,
  Activity, TrendingUp, Database
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import penguinMascot from "@/assets/penguin-mascot.png";

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
  penguin_stage: string;
  shrimp_total: number;
  salmon_total: number;
  golden_fish_total: number;
  ai_credits: number;
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
  
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [creditsUser, setCreditsUser] = useState<UserData | null>(null);
  const [creditsAmount, setCreditsAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<'game' | 'ai'>('game');
  
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState<UserData | null>(null);
  
  const [serverVerifiedAdmin, setServerVerifiedAdmin] = useState<boolean | null>(null);
  const [verifyingAdmin, setVerifyingAdmin] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user) { setServerVerifiedAdmin(false); setVerifyingAdmin(false); return; }
      setServerVerifiedAdmin(clientIsAdmin);
      setVerifyingAdmin(false);
    };
    if (!isLoading) verifyAdmin();
  }, [user, isLoading, clientIsAdmin]);

  const isAdmin = serverVerifiedAdmin ?? clientIsAdmin;

  useEffect(() => {
    if (isAdmin && !verifyingAdmin) fetchUsers();
  }, [isAdmin, verifyingAdmin]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => u.email.toLowerCase().includes(query) || (u.display_name && u.display_name.toLowerCase().includes(query))));
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase.from("user_profiles").select("id, email, display_name, created_at").order("created_at", { ascending: false });
      if (profilesError) throw profilesError;
      const { data: bannedUsers } = await supabase.from("banned_users").select("user_id");
      const { data: adminUsers } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const bannedIds = new Set(bannedUsers?.map(b => b.user_id) || []);
      const adminIds = new Set(adminUsers?.map(a => a.user_id) || []);
      const usersWithStatus: UserData[] = (profiles || []).map(p => ({
        id: p.id, email: p.email || "", display_name: p.display_name,
        created_at: p.created_at, is_banned: bannedIds.has(p.id), is_admin: adminIds.has(p.id),
      }));
      setUsers(usersWithStatus);
      setFilteredUsers(usersWithStatus);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally { setLoading(false); }
  };

  const fetchUserStats = async (userId: string) => {
    setStatsUserLoading(true);
    try {
      const [tasksRes, habitsRes, goalsRes, focusRes, penguinRes, aiCreditsRes] = await Promise.allSettled([
        supabase.from("tasks").select("id").eq("user_id", userId).eq("completed", true),
        supabase.from("habits").select("id").eq("user_id", userId),
        supabase.from("goals").select("id").eq("user_id", userId),
        supabase.from("focus_sessions").select("duration").eq("user_id", userId),
        supabase.from("penguin_profiles").select("stage, shrimp_total, salmon_total, golden_fish_total").eq("user_id", userId).single(),
        supabase.from("ai_credits").select("credits").eq("user_id", userId).single(),
      ]);

      const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.data?.length || 0 : 0;
      const habits = habitsRes.status === "fulfilled" ? habitsRes.value.data?.length || 0 : 0;
      const goals = goalsRes.status === "fulfilled" ? goalsRes.value.data?.length || 0 : 0;
      const focusSessions = focusRes.status === "fulfilled" ? focusRes.value.data || [] : [];
      const penguin = penguinRes.status === "fulfilled" ? penguinRes.value.data : null;
      const aiCredits = aiCreditsRes.status === "fulfilled" ? aiCreditsRes.value.data : null;
      const totalMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

      setUserStats({
        tasks_completed: tasks, habits_count: habits, goals_count: goals,
        focus_minutes: totalMinutes,
        penguin_stage: penguin?.stage || 'egg',
        shrimp_total: penguin?.shrimp_total || 0,
        salmon_total: penguin?.salmon_total || 0,
        golden_fish_total: penguin?.golden_fish_total || 0,
        ai_credits: aiCredits?.credits || 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally { setStatsUserLoading(false); }
  };

  const handleViewUser = (userData: UserData) => { setSelectedUser(userData); setUserStats(null); fetchUserStats(userData.id); };

  const handleBanUser = async () => {
    if (!userToBan || !user) return;
    try {
      const { error } = await supabase.from("banned_users").insert({ user_id: userToBan.id, banned_by: user.id, reason: banReason || null });
      if (error) throw error;
      await logAction("ban_user", userToBan.id, userToBan.email, { reason: banReason });
      toast.success(`${userToBan.email} a été banni`);
      setBanDialogOpen(false); setUserToBan(null); setBanReason(""); fetchUsers();
    } catch (error) { console.error("Error banning user:", error); toast.error("Erreur lors du bannissement"); }
  };

  const handleUnbanUser = async (userData: UserData) => {
    try {
      const { error } = await supabase.from("banned_users").delete().eq("user_id", userData.id);
      if (error) throw error;
      await logAction("unban_user", userData.id, userData.email);
      toast.success(`${userData.email} a été débanni`); fetchUsers();
    } catch (error) { console.error("Error unbanning user:", error); toast.error("Erreur lors du débannissement"); }
  };

  const handlePromoteToAdmin = async () => {
    if (!userToPromote) return;
    try {
      const { error } = await supabase.from("user_roles").insert({ user_id: userToPromote.id, role: "admin" });
      if (error) throw error;
      await logAction("promote_admin", userToPromote.id, userToPromote.email);
      toast.success(`${userToPromote.email} est maintenant administrateur`);
      setPromoteDialogOpen(false); setUserToPromote(null); fetchUsers();
    } catch (error) { console.error("Error promoting user:", error); toast.error("Erreur lors de la promotion"); }
  };

  const handleDemoteAdmin = async (userData: UserData) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userData.id).eq("role", "admin");
      if (error) throw error;
      await logAction("demote_admin", userData.id, userData.email);
      toast.success(`${userData.email} n'est plus administrateur`); fetchUsers();
    } catch (error) { console.error("Error demoting user:", error); toast.error("Erreur lors de la rétrogradation"); }
  };

  const handleGiveCredits = async () => {
    if (!creditsUser || creditsAmount === 0) return;
    try {
      if (creditType === 'game') {
        const { data: profile } = await supabase.from("player_profiles").select("credits").eq("user_id", creditsUser.id).single();
        const newCredits = Math.max(0, (profile?.credits || 0) + creditsAmount);
        const { error } = await supabase.from("player_profiles").update({ credits: newCredits }).eq("user_id", creditsUser.id);
        if (error) throw error;
        await logAction("modify_game_credits", creditsUser.id, creditsUser.email, { type: 'game', amount: creditsAmount, new_total: newCredits });
        toast.success(`${creditsAmount > 0 ? "+" : ""}${creditsAmount} crédits jeu pour ${creditsUser.email}`);
      } else {
        const { data: existing } = await supabase.from("ai_credits").select("credits").eq("user_id", creditsUser.id).maybeSingle();
        const newCredits = Math.max(0, (existing?.credits || 0) + creditsAmount);
        if (existing) {
          const { error } = await supabase.from("ai_credits").update({ credits: newCredits, last_updated: new Date().toISOString() }).eq("user_id", creditsUser.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("ai_credits").insert({ user_id: creditsUser.id, credits: newCredits });
          if (error) throw error;
        }
        await logAction("modify_ai_credits", creditsUser.id, creditsUser.email, { type: 'ai', amount: creditsAmount, new_total: newCredits });
        toast.success(`${creditsAmount > 0 ? "+" : ""}${creditsAmount} crédits IA pour ${creditsUser.email}`);
      }
      setCreditsDialogOpen(false); setCreditsUser(null); setCreditsAmount(0);
    } catch (error) { console.error("Error modifying credits:", error); toast.error("Erreur lors de la modification des crédits"); }
  };

  const exportUsersCSV = () => {
    const headers = ["Email", "Nom", "Date inscription", "Banni", "Admin"];
    const rows = users.map(u => [u.email, u.display_name || "", new Date(u.created_at).toLocaleDateString("fr-FR"), u.is_banned ? "Oui" : "Non", u.is_admin ? "Oui" : "Non"]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    logAction("export_users_csv", undefined, undefined, { count: users.length });
    toast.success("Export CSV téléchargé");
  };

  const openBanDialog = (userData: UserData) => { setUserToBan(userData); setBanDialogOpen(true); };
  const openCreditsDialog = (userData: UserData) => { setCreditsUser(userData); setCreditsAmount(0); setCreditType('game'); setCreditsDialogOpen(true); };
  const openPromoteDialog = (userData: UserData) => { setUserToPromote(userData); setPromoteDialogOpen(true); };

  if (isLoading || verifyingAdmin) {
    return (<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>);
  }

  if (serverVerifiedAdmin !== true) {
    return <Navigate to="/dashboard" replace />;
  }

  const STAGE_LABELS: Record<string, string> = { egg: '🥚 Œuf', chick: '🐣 Poussin', explorer: '🐧 Explorateur', emperor: '👑 Empereur' };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Administration</h1>
          <p className="text-muted-foreground text-sm">Gestion complète de la plateforme DeepFlow</p>
        </div>
        <img src={penguinMascot} alt="" className="h-12 w-12 object-contain opacity-60 hidden md:block" />
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-semibold">Admin</Badge>
      </div>

      {/* Platform Stats - Improved grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{statsLoading ? '...' : platformStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4 text-center">
            <UserPlus className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-bold">{statsLoading ? '...' : platformStats.newUsersThisWeek}</div>
            <p className="text-xs text-muted-foreground">Nouveaux (7j)</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 text-center">
            <CheckSquare className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{statsLoading ? '...' : platformStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tâches totales</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{statsLoading ? '...' : `${Math.round(platformStats.totalFocusMinutes / 60)}h`}</div>
            <p className="text-xs text-muted-foreground">Focus total</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10"><Flame className="h-4 w-4 text-orange-500" /></div>
            <div><div className="text-lg font-bold">{statsLoading ? '...' : platformStats.totalHabits}</div><p className="text-xs text-muted-foreground">Habitudes</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
            <div><div className="text-lg font-bold">{statsLoading ? '...' : platformStats.totalGoals}</div><p className="text-xs text-muted-foreground">Objectifs</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><Trophy className="h-4 w-4 text-yellow-500" /></div>
            <div><div className="text-lg font-bold">∞</div><p className="text-xs text-muted-foreground">Crédits Admin</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="users" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" /><span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4" /><span className="hidden sm:inline">Rôles</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" /><span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Gestion des Utilisateurs</CardTitle>
                  <CardDescription>{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchUsers}><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={exportUsersCSV}><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div></div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredUsers.map((userData) => (
                      <div key={userData.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm ${userData.is_banned ? "bg-red-500/5 border-red-500/20" : userData.is_admin ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20 border-border/50 hover:bg-muted/40"}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${userData.is_banned ? "bg-red-500" : userData.is_admin ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-sky-500 to-indigo-500"}`}>
                            {userData.is_admin ? <Crown className="h-5 w-5" /> : userData.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate text-sm">{userData.email}</span>
                              {userData.is_admin && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Admin</Badge>}
                              {userData.is_banned && <Badge variant="destructive" className="text-[10px]">Banni</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{userData.display_name || "Sans nom"} • {format(new Date(userData.created_at), "d MMM yyyy", { locale: fr })}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewUser(userData)} title="Voir"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openCreditsDialog(userData)} title="Crédits"><Coins className="h-4 w-4" /></Button>
                          {userData.is_banned ? (
                            <Button variant="ghost" size="icon" onClick={() => handleUnbanUser(userData)} className="text-emerald-600" title="Débannir"><UserCheck className="h-4 w-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => openBanDialog(userData)} className="text-red-600" title="Bannir"><Ban className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</div>}
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
              <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" />Gestion des Rôles</CardTitle>
              <CardDescription>Promouvoir ou rétrograder les administrateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher un utilisateur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm"><Crown className="h-4 w-4 text-amber-500" />Administrateurs ({users.filter(u => u.is_admin).length})</h3>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {users.filter(u => u.is_admin).map(userData => (
                          <div key={userData.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium truncate">{userData.email}</span></div>
                            {userData.id !== user?.id && <Button variant="ghost" size="sm" onClick={() => handleDemoteAdmin(userData)} className="text-red-600 text-xs">Rétrograder</Button>}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Utilisateurs ({filteredUsers.filter(u => !u.is_admin).length})</h3>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {filteredUsers.filter(u => !u.is_admin && !u.is_banned).slice(0, 20).map(userData => (
                          <div key={userData.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                            <span className="text-sm font-medium truncate flex-1">{userData.email}</span>
                            <Button variant="outline" size="sm" onClick={() => openPromoteDialog(userData)} className="text-xs">Promouvoir</Button>
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
                  <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Historique des Actions</CardTitle>
                  <CardDescription>Suivi des actions administratives</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {adminLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune action enregistrée</div>
                  ) : (
                    adminLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Shield className="h-4 w-4 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{log.action}</span>
                            {log.target_user_email && <Badge variant="outline" className="text-xs">{log.target_user_email}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">Par {log.admin_email} • {format(new Date(log.created_at), "d MMM yyyy à HH:mm", { locale: fr })}</p>
                          {log.details && <p className="text-xs text-muted-foreground mt-1 font-mono">{JSON.stringify(log.details)}</p>}
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

      {/* User Details Dialog - Now with penguin stats */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold ${selectedUser?.is_banned ? "bg-red-500" : selectedUser?.is_admin ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-sky-500 to-indigo-500"}`}>
                {selectedUser?.is_admin ? <Crown className="h-4 w-4" /> : selectedUser?.email.charAt(0).toUpperCase()}
              </div>
              {selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name || "Sans nom"} • Membre depuis le {selectedUser && format(new Date(selectedUser.created_at), "d MMMM yyyy", { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {statsUserLoading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div></div>
          ) : userStats ? (
            <div className="space-y-4">
              {/* Productivity stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                  <CheckSquare className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                  <div className="text-lg font-bold">{userStats.tasks_completed}</div>
                  <p className="text-[10px] text-muted-foreground">Tâches</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                  <Target className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{userStats.habits_count}</div>
                  <p className="text-[10px] text-muted-foreground">Habitudes</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                  <Trophy className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                  <div className="text-lg font-bold">{userStats.goals_count}</div>
                  <p className="text-[10px] text-muted-foreground">Objectifs</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                  <Timer className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                  <div className="text-lg font-bold">{Math.round(userStats.focus_minutes / 60)}h</div>
                  <p className="text-[10px] text-muted-foreground">Focus</p>
                </div>
              </div>

              {/* Penguin stats */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <img src={penguinMascot} alt="" className="h-10 w-10 object-contain" />
                  <div>
                    <p className="text-sm font-semibold">{STAGE_LABELS[userStats.penguin_stage] || userStats.penguin_stage}</p>
                    <p className="text-xs text-muted-foreground">Pingouin</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><span className="text-sm">🦐</span><div className="text-sm font-bold">{userStats.shrimp_total}</div></div>
                  <div><span className="text-sm">🐟</span><div className="text-sm font-bold">{userStats.salmon_total}</div></div>
                  <div><span className="text-sm">✨🐠</span><div className="text-sm font-bold">{userStats.golden_fish_total}</div></div>
                </div>
              </div>

              {/* AI Credits */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Crédits IA</span>
                </div>
                <span className="font-bold text-primary">{userStats.ai_credits}</span>
              </div>

              {selectedUser?.is_banned && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
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
            <AlertDialogDescription>Êtes-vous sûr de vouloir bannir {userToBan?.email} ?</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input placeholder="Raison du bannissement (optionnel)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason("")}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} className="bg-red-500 hover:bg-red-600">Bannir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-amber-500" />Gérer les crédits</DialogTitle>
            <DialogDescription>Ajouter ou retirer des crédits pour {creditsUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button variant={creditType === 'game' ? 'default' : 'outline'} size="sm" onClick={() => setCreditType('game')} className="flex-1"><Coins className="h-4 w-4 mr-2" />Crédits Jeu</Button>
              <Button variant={creditType === 'ai' ? 'default' : 'outline'} size="sm" onClick={() => setCreditType('ai')} className="flex-1"><Sparkles className="h-4 w-4 mr-2" />Crédits IA</Button>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev - 100)}>-100</Button>
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev - 10)}>-10</Button>
              <Input type="number" value={creditsAmount} onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)} className="text-center" />
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev + 10)}>+10</Button>
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev + 100)}>+100</Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {creditsAmount > 0 ? `Ajouter ${creditsAmount} crédits ${creditType === 'ai' ? 'IA' : 'jeu'}` : creditsAmount < 0 ? `Retirer ${Math.abs(creditsAmount)} crédits ${creditType === 'ai' ? 'IA' : 'jeu'}` : "Aucun changement"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleGiveCredits} disabled={creditsAmount === 0}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promouvoir en administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>{userToPromote?.email} aura accès à toutes les fonctionnalités d'administration.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteToAdmin}>Promouvoir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}