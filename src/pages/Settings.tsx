import { useState, useEffect, useCallback } from "react";
import SoundService from "@/services/soundService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useDesignMode } from "@/contexts/DesignModeContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useSubscription } from "@/hooks/useSubscription";
import { Link, useSearchParams } from "react-router-dom";
import { PremiumUpgradeCard } from "@/components/PremiumUpgradeCard";
import { ProfileEditForm } from "@/components/settings/ProfileEditForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { 
  Settings as SettingsIcon, User, Bell, Palette, Moon, Sun, Volume2, Zap, Brain, Trophy,
  Gamepad2, Sparkles, LogOut, RefreshCw, Timer, Target, CheckSquare, Flame,
  Apple, Wand2, Info, Mail, Copy, ExternalLink, FileText, Shield, HelpCircle,
  Key, Trash2, Download
} from "lucide-react";

const penguinMascot = "https://cdn-icons-png.flaticon.com/512/1864/1864514.png";

interface UserSettings {
  id: string;
  notifications_enabled?: boolean;
  sound_enabled?: boolean;
  focus_mode?: boolean;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { designMode, setDesignMode } = useDesignMode();
  const { credits: aiCredits } = useAICredits();
  const { handleManageSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notifications_enabled: true,
    sound_enabled: true,
    focus_mode: false
  });

  const [stats, setStats] = useState({
    tasks_completed: 0, habits_tracked: 0, focus_sessions: 0,
    focus_minutes: 0, streak_max: 0, goals_completed: 0, journal_entries: 0
  });

  const [userProfile, setUserProfile] = useState<{ display_name: string | null; photo_url: string | null } | null>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Paiement réussi ! Bienvenue dans Premium 🎉");
    } else if (payment === "cancelled") {
      toast.error("Paiement annulé");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) { fetchSettings(); fetchStats(); fetchUserProfile(); fetchPlayerProfile(); }
  }, [user]);

  const fetchPlayerProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('penguin_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (data) setPlayerProfile(data);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select('display_name, photo_url').eq('id', user.id).maybeSingle();
    if (data) setUserProfile(data);
  };

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('user_settings').select('*').eq('id', user.id).maybeSingle();
      if (error && error.code !== 'PGRST116') return;
      if (data) setFormData({ notifications_enabled: data.notifications_enabled ?? true, sound_enabled: data.sound_enabled ?? true, focus_mode: data.focus_mode ?? false });
    } catch (error) { console.error('Error fetching settings:', error); }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [tasksRes, habitsRes, focusRes, goalsRes, journalRes] = await Promise.allSettled([
        supabase.from('tasks').select('id').eq('user_id', user.id).eq('completed', true),
        supabase.from('habits').select('id, streak').eq('user_id', user.id),
        supabase.from('focus_sessions').select('duration').eq('user_id', user.id),
        supabase.from('goals').select('id').eq('user_id', user.id).eq('completed', true),
        supabase.from('journal_entries').select('id').eq('user_id', user.id)
      ]);
      const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data?.length || 0) : 0;
      const habits = habitsRes.status === 'fulfilled' ? (habitsRes.value.data || []) : [];
      const focusSessions = focusRes.status === 'fulfilled' ? (focusRes.value.data || []) : [];
      const goals = goalsRes.status === 'fulfilled' ? (goalsRes.value.data?.length || 0) : 0;
      const journal = journalRes.status === 'fulfilled' ? (journalRes.value.data?.length || 0) : 0;
      const maxStreak = Math.max(...habits.map(h => h.streak || 0), 0);
      const totalMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      setStats({ tasks_completed: tasks, habits_tracked: habits.length, focus_sessions: focusSessions.length, focus_minutes: totalMinutes, streak_max: maxStreak, goals_completed: goals, journal_entries: journal });
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const autoSavePreferences = useCallback(async (newFormData: typeof formData) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_settings').upsert({ id: user.id, ...newFormData, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Préférences sauvegardées");
    } catch (error: any) { toast.error("Erreur: " + error.message); }
  }, [user]);

  const updatePreference = (key: keyof typeof formData, value: boolean) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);
    autoSavePreferences(newFormData);
    // Sync sound setting with SoundService
    if (key === 'sound_enabled') {
      SoundService.getInstance().setEnabled(value);
    }
  };

  const handleLogout = async () => {
    try { await signOut(); toast.success("Déconnexion réussie"); } catch (error) { toast.error("Erreur lors de la déconnexion"); }
  };

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Mot de passe modifié avec succès");
      setNewPassword("");
    } catch (err: any) { toast.error(err.message || "Erreur"); }
    finally { setChangingPassword(false); }
  };

  // Account deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleDeleteAccount = async () => {
    try {
      // Delete all user data from major tables
      const tables = ["tasks", "habits", "goals", "focus_sessions", "journal_entries", "daily_reflections", "habit_completions", "penguin_profiles", "ai_credits", "ai_requests", "daily_usage"] as const;
      for (const table of tables) {
        await (supabase.from(table).delete() as any).eq("user_id", user!.id);
      }
      await supabase.from("user_profiles").delete().eq("id", user!.id);
      await supabase.from("user_settings").delete().eq("id", user!.id);
      // Sign out after purge
      await signOut();
      toast.success("Compte supprimé. Adieu 🐧");
    } catch (err) { toast.error("Erreur lors de la suppression du compte"); }
  };

  // Data export
  const handleExportData = async () => {
    if (!user) return;
    try {
      const [tasks, habits, goals, journal, focus] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("focus_sessions").select("*").eq("user_id", user.id),
      ]);
      const exportData = { tasks: tasks.data, habits: habits.data, goals: goals.data, journal: journal.data, focus: focus.data, exported_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `deepflow_export_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      toast.success("Données exportées !");
    } catch { toast.error("Erreur lors de l'export"); }
  };

  const stageLabel = playerProfile?.stage === 'emperor' ? 'Empereur' : playerProfile?.stage === 'explorer' ? 'Explorateur' : playerProfile?.stage === 'chick' ? 'Poussin' : 'Œuf';

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 h-12">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Préférences</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5 text-xs sm:text-sm">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">À propos</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-5">
          <Card className="border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-lg">
                    <AvatarImage src={userProfile?.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold">
                      {userProfile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg truncate">{userProfile?.display_name || user?.email}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <img src={penguinMascot} alt="" className="h-4 w-4 object-contain" />
                      <span>{stageLabel}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">🐟 {playerProfile?.salmon_total || 0} saumons</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="self-start">
                  <Link to="/gamification"><Trophy className="h-4 w-4 mr-2" />Mon Pingouin</Link>
                </Button>
              </div>
            </div>
          </Card>

          <ProfileEditForm />
          
          {/* AI Credits Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Crédits IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">{aiCredits === Infinity ? "∞" : aiCredits}</div>
                  <p className="text-xs text-muted-foreground">crédits disponibles</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/gamification"><Gamepad2 className="h-4 w-4 mr-2" />Boutique</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Key className="h-5 w-5 text-primary" />Mot de passe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="password" placeholder="Nouveau mot de passe (min. 6 car.)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button onClick={handleChangePassword} disabled={changingPassword || newPassword.length < 6} className="w-full">
                {changingPassword ? "Modification..." : "Modifier le mot de passe"}
              </Button>
            </CardContent>
          </Card>

          {/* Data & Account Management */}
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-destructive" />Données & Compte</CardTitle>
              <CardDescription>Export RGPD et suppression de compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportData}>
                <Download className="h-4 w-4" /> Exporter mes données (JSON)
              </Button>
              <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" /> Supprimer mon compte
              </Button>
            </CardContent>
          </Card>
          
          <PremiumUpgradeCard />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-5">
          {/* Apparence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Palette className="h-5 w-5 text-primary" />Apparence</CardTitle>
              <CardDescription>Personnalisez le look de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Thème</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTheme('light')} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'light' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}>
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium">Clair</span>
                  </button>
                  <button onClick={() => setTheme('dark')} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}>
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium">Sombre</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" />Notifications</CardTitle>
              <CardDescription>Gérez vos alertes et sons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Bell className="h-4 w-4 text-primary" /></div>
                  <div>
                    <span className="text-sm font-medium">Notifications push</span>
                    <p className="text-xs text-muted-foreground">Alertes en temps réel</p>
                  </div>
                </div>
                <Switch
                  checked={formData.notifications_enabled}
                  onCheckedChange={async (checked) => {
                    if (checked && 'Notification' in window) {
                      const permission = await Notification.requestPermission();
                      if (permission !== 'granted') { toast.error("Notifications bloquées"); return; }
                    }
                    updatePreference('notifications_enabled', checked);
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Volume2 className="h-4 w-4 text-primary" /></div>
                  <div>
                    <span className="text-sm font-medium">Sons</span>
                    <p className="text-xs text-muted-foreground">Retour audio</p>
                  </div>
                </div>
                <Switch checked={formData.sound_enabled} onCheckedChange={(checked) => updatePreference('sound_enabled', checked)} />
              </div>
            </CardContent>
          </Card>

          {/* Productivité */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-primary" />Productivité</CardTitle>
              <CardDescription>Optimisez vos sessions de travail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10"><Zap className="h-4 w-4 text-amber-500" /></div>
                  <div>
                    <span className="text-sm font-medium">Mode Focus</span>
                    <p className="text-xs text-muted-foreground">Désactive les notifications pendant les sessions</p>
                  </div>
                </div>
                <Switch checked={formData.focus_mode} onCheckedChange={(checked) => updatePreference('focus_mode', checked)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Statistiques</CardTitle>
              <CardDescription>Votre activité sur DeepFlow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <CheckSquare className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold">{stats.tasks_completed}</div>
                  <div className="text-xs text-muted-foreground">Tâches</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <Target className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{stats.habits_tracked}</div>
                  <div className="text-xs text-muted-foreground">Habitudes</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <Timer className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{Math.round(stats.focus_minutes / 60)}h</div>
                  <div className="text-xs text-muted-foreground">Focus</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <Flame className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{stats.streak_max}</div>
                  <div className="text-xs text-muted-foreground">Max Streak</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="text-lg font-semibold">{stats.goals_completed}</div>
                  <div className="text-xs text-muted-foreground">Objectifs</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="text-lg font-semibold">{stats.journal_entries}</div>
                  <div className="text-xs text-muted-foreground">Journal</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="text-lg font-semibold">{stats.focus_sessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Penguin gamification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src={penguinMascot} alt="" className="h-5 w-5 object-contain" />
                Progression Pingouin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                  <span className="text-xl block mb-1">🐧</span>
                  <div className="text-lg font-bold">{stageLabel}</div>
                  <div className="text-xs text-muted-foreground">Stade</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <span className="text-xl block mb-1">🦐</span>
                  <div className="text-lg font-bold">{playerProfile?.shrimp_total || 0}</div>
                  <div className="text-xs text-muted-foreground">Crevettes</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <span className="text-xl block mb-1">🐟</span>
                  <div className="text-lg font-bold">{playerProfile?.salmon_total || 0}</div>
                  <div className="text-xs text-muted-foreground">Saumons</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <span className="text-xl block mb-1">✨🐠</span>
                  <div className="text-lg font-bold">{playerProfile?.golden_fish_total || 0}</div>
                  <div className="text-xs text-muted-foreground">Poissons Dorés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={fetchStats} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Mentions Légales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div><strong className="text-foreground">Éditeur :</strong> DeepFlow</div>
              <div><strong className="text-foreground">Email :</strong> deepflow.ia@gmail.com</div>
              <div><strong className="text-foreground">Hébergement :</strong> Supabase / Lovable</div>
              <div><strong className="text-foreground">Pays :</strong> France 🇫🇷</div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild><Link to="/legal/privacy"><FileText className="h-4 w-4 mr-1" />Confidentialité</Link></Button>
                <Button variant="outline" size="sm" asChild><Link to="/legal/terms"><FileText className="h-4 w-4 mr-1" />CGU</Link></Button>
                <Button variant="outline" size="sm" asChild><Link to="/legal/cookies"><FileText className="h-4 w-4 mr-1" />Cookies</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="1">
                  <AccordionTrigger className="text-sm">Comment fonctionne DeepFlow ?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">DeepFlow combine gestion de tâches, habitudes, focus, journaling et gamification. L'IA analyse vos données pour des insights personnalisés.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="2">
                  <AccordionTrigger className="text-sm">Qu'est-ce que les crédits IA ?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Les crédits IA permettent d'utiliser les fonctionnalités d'intelligence artificielle. Chaque requête consomme des crédits. Vous en recevez 50 au départ.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="3">
                  <AccordionTrigger className="text-sm">Comment nourrir mon pingouin ?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Complétez des tâches pour des crevettes 🦐, des sessions de focus (+1h) pour du saumon 🐟, et maintenez des séries pour des poissons dorés ✨🐠.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="4">
                  <AccordionTrigger className="text-sm">Mes données sont-elles sécurisées ?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Oui. Chiffrement en transit et au repos via Supabase. Données jamais partagées sans consentement.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="5">
                  <AccordionTrigger className="text-sm">Puis-je utiliser DeepFlow hors ligne ?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Oui, grâce au mode PWA. Les données se synchronisent automatiquement à la reconnexion.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">deepflow.ia@gmail.com</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText("deepflow.ia@gmail.com"); toast.success("Email copié !"); }} title="Copier"><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" asChild title="Email"><a href="mailto:deepflow.ia@gmail.com"><ExternalLink className="h-4 w-4" /></a></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-4">
            <Badge variant="outline">v1.0.0</Badge>
            <span>•</span>
            <span>🇫🇷 Made in France</span>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />
      <div className="flex justify-center pb-4">
        <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
          <LogOut className="h-4 w-4 mr-2" />Déconnexion
        </Button>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes vos données (tâches, habitudes, journal, pingouin…) seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">Supprimer définitivement</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
