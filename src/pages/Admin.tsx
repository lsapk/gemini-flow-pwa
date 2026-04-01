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
  History, Download, UserPlus, Flame,
  AlertTriangle, ToggleLeft, Send, FileText, Activity, Database
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const penguinMascot = "https://cdn-icons-png.flaticon.com/512/1864/1864514.png";

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
  journal_count: number;
  subscription_tier: string;
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

  // AI credits dialog
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [creditsUser, setCreditsUser] = useState<UserData | null>(null);
  const [creditsAmount, setCreditsAmount] = useState<number>(0);

  // Subscription dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subUser, setSubUser] = useState<UserData | null>(null);
  const [subTier, setSubTier] = useState<string>("basic");

  // Reset penguin dialog
  const [resetPenguinOpen, setResetPenguinOpen] = useState(false);
  const [resetPenguinUser, setResetPenguinUser] = useState<UserData | null>(null);

  // Announcement dialog
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  // Mass action
  const [massActionOpen, setMassActionOpen] = useState(false);

  const [serverVerifiedAdmin, setServerVerifiedAdmin] = useState<boolean | null>(null);
  const [verifyingAdmin, setVerifyingAdmin] = useState(true);

  // Server-side admin verification — never trust client state alone
  useEffect(() => {
    if (isLoading || !user) return;
    const verifyAdmin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-admin');
        if (error) throw error;
        setServerVerifiedAdmin(data?.isAdmin === true);
      } catch (err) {
        console.error('Admin verification failed:', err);
        setServerVerifiedAdmin(false);
      } finally {
        setVerifyingAdmin(false);
      }
    };
    verifyAdmin();
  }, [isLoading, user]);

  const isAdmin = serverVerifiedAdmin === true;

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
      const [tasksRes, habitsRes, goalsRes, focusRes, penguinRes, aiCreditsRes, journalRes, subRes] = await Promise.allSettled([
        supabase.from("tasks").select("id").eq("user_id", userId).eq("completed", true),
        supabase.from("habits").select("id").eq("user_id", userId),
        supabase.from("goals").select("id").eq("user_id", userId),
        supabase.from("focus_sessions").select("duration").eq("user_id", userId),
        supabase.from("penguin_profiles").select("stage, shrimp_total, salmon_total, golden_fish_total").eq("user_id", userId).single(),
        supabase.from("ai_credits").select("credits").eq("user_id", userId).single(),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("subscribers").select("subscription_tier").eq("user_id", userId).maybeSingle(),
      ]);

      const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.data?.length || 0 : 0;
      const habits = habitsRes.status === "fulfilled" ? habitsRes.value.data?.length || 0 : 0;
      const goals = goalsRes.status === "fulfilled" ? goalsRes.value.data?.length || 0 : 0;
      const focusSessions = focusRes.status === "fulfilled" ? focusRes.value.data || [] : [];
      const penguin = penguinRes.status === "fulfilled" ? penguinRes.value.data : null;
      const aiCredits = aiCreditsRes.status === "fulfilled" ? aiCreditsRes.value.data : null;
      const journalCount = journalRes.status === "fulfilled" ? journalRes.value.count || 0 : 0;
      const sub = subRes.status === "fulfilled" ? subRes.value.data : null;
      const totalMinutes = focusSessions.reduce((acc: number, s: { duration: number }) => acc + (s.duration || 0), 0);

      setUserStats({
        tasks_completed: tasks, habits_count: habits, goals_count: goals,
        focus_minutes: totalMinutes,
        penguin_stage: penguin?.stage || 'egg',
        shrimp_total: penguin?.shrimp_total || 0,
        salmon_total: penguin?.salmon_total || 0,
        golden_fish_total: penguin?.golden_fish_total || 0,
        ai_credits: aiCredits?.credits || 0,
        journal_count: journalCount,
        subscription_tier: sub?.subscription_tier || 'basic',
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

  // Give/remove AI credits
  const handleGiveCredits = async () => {
    if (!creditsUser || creditsAmount === 0) return;
    try {
      const { data: existing } = await supabase.from("ai_credits").select("credits").eq("user_id", creditsUser.id).maybeSingle();
      const newCredits = Math.max(0, (existing?.credits || 0) + creditsAmount);
      if (existing) {
        const { error } = await supabase.from("ai_credits").update({ credits: newCredits, last_updated: new Date().toISOString() }).eq("user_id", creditsUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_credits").insert({ user_id: creditsUser.id, credits: newCredits });
        if (error) throw error;
      }
      await logAction("modify_ai_credits", creditsUser.id, creditsUser.email, { amount: creditsAmount, new_total: newCredits });
      toast.success(`${creditsAmount > 0 ? "+" : ""}${creditsAmount} crédits IA pour ${creditsUser.email}`);
      setCreditsDialogOpen(false); setCreditsUser(null); setCreditsAmount(0);
    } catch (error) { console.error("Error modifying credits:", error); toast.error("Erreur lors de la modification"); }
  };

  // Change subscription tier
  const handleChangeSubscription = async () => {
    if (!subUser) return;
    try {
      const { data: existing } = await supabase.from("subscribers").select("id").eq("user_id", subUser.id).maybeSingle();
      if (existing) {
        await supabase.from("subscribers").update({
          subscription_tier: subTier,
          subscribed: subTier !== "basic",
          subscription_end: subTier !== "basic" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", subUser.id);
      } else {
        await supabase.from("subscribers").insert([{
          user_id: subUser.id,
          subscription_tier: subTier,
          subscribed: subTier !== "basic",
          subscription_end: subTier !== "basic" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
        }] as never[]);
      }
      await logAction("change_subscription", subUser.id, subUser.email, { tier: subTier });
      toast.success(`Abonnement de ${subUser.email} → ${subTier}`);
      setSubDialogOpen(false); setSubUser(null);
    } catch (error) { toast.error("Erreur"); }
  };

  // Reset penguin
  const handleResetPenguin = async () => {
    if (!resetPenguinUser) return;
    try {
      await supabase.from("penguin_profiles").update({
        stage: "egg", shrimp_total: 0, salmon_total: 0, golden_fish_total: 0,
        shrimp_today: 0, iceberg_size: 1, climate_state: "idle",
        has_radio: false, has_library: false, has_lounge_chair: false,
        equipped_accessories: [],
      }).eq("user_id", resetPenguinUser.id);
      await supabase.from("penguin_accessories").delete().eq("user_id", resetPenguinUser.id);
      await logAction("reset_penguin", resetPenguinUser.id, resetPenguinUser.email);
      toast.success(`Pingouin de ${resetPenguinUser.email} réinitialisé`);
      setResetPenguinOpen(false); setResetPenguinUser(null);
    } catch (error) { toast.error("Erreur"); }
  };

  // Purge user data
  const handlePurgeUserData = async (userData: UserData) => {
    if (!confirm(`Purger TOUTES les données de ${userData.email} ? Cette action est irréversible.`)) return;
    try {
      const tablesToPurge = ["tasks", "habits", "goals", "focus_sessions", "journal_entries", "daily_reflections", "habit_completions"] as const;
      for (const table of tablesToPurge) {
        await (supabase.from(table).delete() as any).eq("user_id", userData.id);
      }
      await logAction("purge_user_data", userData.id, userData.email);
      toast.success(`Données de ${userData.email} purgées`);
    } catch (error) { toast.error("Erreur lors de la purge"); }
  };

  // Send announcement
  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim() || !user) return;
    try {
      await supabase.from("admin_announcements").insert({
        title: announcementTitle, content: announcementContent,
        created_by: user.id, is_active: true, announcement_type: "info",
      });
      await logAction("send_announcement", undefined, undefined, { title: announcementTitle });
      toast.success("Annonce publiée");
      setAnnouncementOpen(false); setAnnouncementTitle(""); setAnnouncementContent("");
    } catch (error) { toast.error("Erreur"); }
  };

  // Mass reset daily usage
  const handleMassResetUsage = async () => {
    if (!confirm("Réinitialiser les compteurs quotidiens de tous les utilisateurs ?")) return;
    try {
      await supabase.from("daily_usage").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await logAction("mass_reset_daily_usage");
      toast.success("Compteurs quotidiens réinitialisés");
      setMassActionOpen(false);
    } catch (error) { toast.error("Erreur"); }
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

      {/* Platform Stats */}
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

      {/* Secondary stats */}
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

      {/* Quick Admin Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => setAnnouncementOpen(true)}>
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-[10px]">Annonce</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={exportUsersCSV}>
              <Download className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px]">Export CSV</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => setMassActionOpen(true)}>
              <ToggleLeft className="h-4 w-4 text-orange-500" />
              <span className="text-[10px]">Actions Masse</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span className="text-[10px]">Actualiser</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="users" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" /><span className="hidden sm:inline">Utilisateurs</span>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div></div>
              ) : (
                <ScrollArea className="h-[500px]">
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
                        <div className="flex gap-1 flex-wrap">
                          <Button variant="ghost" size="icon" onClick={() => handleViewUser(userData)} title="Voir détails"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setCreditsUser(userData); setCreditsAmount(0); setCreditsDialogOpen(true); }} title="Crédits IA"><Sparkles className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSubUser(userData); setSubTier("basic"); setSubDialogOpen(true); }} title="Abonnement"><Crown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setResetPenguinUser(userData); setResetPenguinOpen(true); }} title="Reset pingouin"><img src={penguinMascot} alt="" className="h-4 w-4" /></Button>
                          {userData.is_banned ? (
                            <Button variant="ghost" size="icon" onClick={() => handleUnbanUser(userData)} className="text-emerald-600" title="Débannir"><UserCheck className="h-4 w-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => { setUserToBan(userData); setBanDialogOpen(true); }} className="text-red-600" title="Bannir"><Ban className="h-4 w-4" /></Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handlePurgeUserData(userData)} className="text-red-600" title="Purger données"><AlertTriangle className="h-4 w-4" /></Button>
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
              <ScrollArea className="h-[500px]">
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

      {/* User Details Dialog */}
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
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="text-sm">Crédits IA</span></div>
                <span className="font-bold text-primary">{userStats.ai_credits}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /><span className="text-sm">Abonnement</span></div>
                <Badge variant="secondary">{userStats.subscription_tier}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Entrées journal</span></div>
                <span className="font-bold">{userStats.journal_count}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bannir cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir bannir {userToBan?.email} ?</AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="Raison (optionnel)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason("")}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} className="bg-red-500 hover:bg-red-600">Bannir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Crédits IA</DialogTitle>
            <DialogDescription>Modifier les crédits IA de {creditsUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev - 50)}>-50</Button>
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev - 10)}>-10</Button>
              <Input type="number" value={creditsAmount} onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)} className="text-center" />
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev + 10)}>+10</Button>
              <Button variant="outline" onClick={() => setCreditsAmount(prev => prev + 50)}>+50</Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {creditsAmount > 0 ? `+${creditsAmount} crédits` : creditsAmount < 0 ? `${creditsAmount} crédits` : "Aucun changement"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleGiveCredits} disabled={creditsAmount === 0}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" />Abonnement</DialogTitle>
            <DialogDescription>Changer l'abonnement de {subUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant={subTier === "basic" ? "default" : "outline"} onClick={() => setSubTier("basic")} className="h-auto py-4 flex-col gap-1">
              <span className="font-bold">Basic</span>
              <span className="text-xs text-muted-foreground">Gratuit</span>
            </Button>
            <Button variant={subTier === "premium" ? "default" : "outline"} onClick={() => setSubTier("premium")} className="h-auto py-4 flex-col gap-1">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="font-bold">Premium</span>
              <span className="text-xs text-muted-foreground">Illimité</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleChangeSubscription}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Penguin Dialog */}
      <AlertDialog open={resetPenguinOpen} onOpenChange={setResetPenguinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le pingouin ?</AlertDialogTitle>
            <AlertDialogDescription>Le pingouin de {resetPenguinUser?.email} sera remis à zéro (œuf, 0 nourriture, 0 accessoires).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPenguin} className="bg-orange-500 hover:bg-orange-600">Réinitialiser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Announcement Dialog */}
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-blue-500" />Nouvelle Annonce</DialogTitle>
            <DialogDescription>Envoyer une annonce à tous les utilisateurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Titre de l'annonce" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
            <Textarea placeholder="Contenu de l'annonce..." value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>Annuler</Button>
            <Button onClick={handleSendAnnouncement} disabled={!announcementTitle.trim() || !announcementContent.trim()}>Publier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Action Dialog */}
      <Dialog open={massActionOpen} onOpenChange={setMassActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-orange-500" />Actions de Masse</DialogTitle>
            <DialogDescription>Actions appliquées à tous les utilisateurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={handleMassResetUsage}>
              <ToggleLeft className="h-4 w-4 text-orange-500" />
              <div className="text-left">
                <p className="text-sm font-medium">Réinitialiser compteurs quotidiens</p>
                <p className="text-xs text-muted-foreground">Remet à zéro les limites IA de tous les utilisateurs</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
