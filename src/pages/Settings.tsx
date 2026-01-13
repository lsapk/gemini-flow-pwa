import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useAICredits } from "@/hooks/useAICredits";
import { useSubscription } from "@/hooks/useSubscription";
import { Link, useSearchParams } from "react-router-dom";
import { PremiumUpgradeCard } from "@/components/PremiumUpgradeCard";
import { ProfileEditForm } from "@/components/settings/ProfileEditForm";

import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Moon,
  Sun,
  Volume2,
  Zap,
  Brain,
  Trophy,
  Gamepad2,
  Sparkles,
  LogOut,
  RefreshCw,
  Timer,
  Target,
  CheckSquare,
  Flame,
  Award,
} from "lucide-react";

interface UserSettings {
  id: string;
  notifications_enabled?: boolean;
  sound_enabled?: boolean;
  focus_mode?: boolean;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { profile: playerProfile } = usePlayerProfile();
  const { credits: aiCredits } = useAICredits();
  const { capturePayPalOrder } = useSubscription();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notifications_enabled: true,
    sound_enabled: true,
    focus_mode: false
  });

  const [stats, setStats] = useState({
    tasks_completed: 0,
    habits_tracked: 0,
    focus_sessions: 0,
    focus_minutes: 0,
    streak_max: 0,
    goals_completed: 0,
    journal_entries: 0
  });

  // Handle PayPal return
  useEffect(() => {
    const handlePayPalReturn = async () => {
      const payment = searchParams.get("payment");
      const token = searchParams.get("token");
      
      if (payment === "success" && token) {
        try {
          await capturePayPalOrder(token);
        } catch (error) {
          console.error("Error capturing PayPal order:", error);
        }
      } else if (payment === "cancelled") {
        toast.error("Paiement annulé");
      }
    };
    
    handlePayPalReturn();
  }, [searchParams, capturePayPalOrder]);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchStats();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Settings fetch error:', error);
        return;
      }

      if (data) {
        setFormData({
          notifications_enabled: data.notifications_enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          focus_mode: data.focus_mode ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
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

      setStats({
        tasks_completed: tasks,
        habits_tracked: habits.length,
        focus_sessions: focusSessions.length,
        focus_minutes: totalMinutes,
        streak_max: maxStreak,
        goals_completed: goals,
        journal_entries: journal
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Paramètres sauvegardés !");
      fetchSettings();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const xpForNextLevel = playerProfile ? (playerProfile.level * 100) : 100;
  const currentXPProgress = playerProfile ? ((playerProfile.experience_points % 100) / 100) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">Paramètres</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Préférences</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Quick Profile Overview */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{user?.email}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Gamepad2 className="h-4 w-4" />
                      <span>Niveau {playerProfile?.level || 1}</span>
                      <span>•</span>
                      <Sparkles className="h-4 w-4" />
                      <span>{playerProfile?.experience_points || 0} XP</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/gamification">
                      <Trophy className="h-4 w-4 mr-2" />
                      Arène
                    </Link>
                  </Button>
                </div>
              </div>
              
              {playerProfile && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progression niveau {playerProfile.level}</span>
                    <span>{playerProfile.experience_points % 100} / 100 XP</span>
                  </div>
                  <Progress value={currentXPProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Edit Form */}
          <ProfileEditForm />
          
          {/* Premium Subscription */}
          <PremiumUpgradeCard />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Apparence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5" />
                  Apparence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Clair
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Sombre
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="flex-1"
                    >
                      Auto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Notifications push</span>
                  </div>
                  <Switch
                    checked={formData.notifications_enabled}
                    onCheckedChange={async (checked) => {
                      setFormData({...formData, notifications_enabled: checked});
                      if (checked && 'Notification' in window) {
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                          toast.error("Notifications bloquées par le navigateur");
                          setFormData({...formData, notifications_enabled: false});
                        } else {
                          toast.success("Notifications activées");
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sons</span>
                  </div>
                  <Switch
                    checked={formData.sound_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, sound_enabled: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Focus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5" />
                  Productivité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Mode Focus (Ne pas déranger)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Désactive les notifications pendant les sessions
                    </p>
                  </div>
                  <Switch
                    checked={formData.focus_mode}
                    onCheckedChange={(checked) => {
                      setFormData({...formData, focus_mode: checked});
                      if (checked) {
                        toast.success("Mode Ne Pas Déranger activé");
                      } else {
                        toast.info("Mode Ne Pas Déranger désactivé");
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Crédits IA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  Crédits IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-2xl font-bold text-primary">{aiCredits}</div>
                    <p className="text-xs text-muted-foreground">crédits disponibles</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/gamification">
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Boutique
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Sauvegarde..." : "Sauvegarder les préférences"}
          </Button>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Statistiques
              </CardTitle>
              <CardDescription>Votre activité sur DeepFlow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <CheckSquare className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{stats.tasks_completed}</div>
                  <div className="text-xs text-muted-foreground">Tâches</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{stats.habits_tracked}</div>
                  <div className="text-xs text-muted-foreground">Habitudes</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Timer className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{Math.round(stats.focus_minutes / 60)}h</div>
                  <div className="text-xs text-muted-foreground">Focus</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{stats.streak_max}</div>
                  <div className="text-xs text-muted-foreground">Max Streak</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-semibold">{stats.goals_completed}</div>
                  <div className="text-xs text-muted-foreground">Objectifs atteints</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-semibold">{stats.journal_entries}</div>
                  <div className="text-xs text-muted-foreground">Entrées journal</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-lg font-semibold">{stats.focus_sessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions focus</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gamification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Progression Gamification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{playerProfile?.level || 1}</div>
                  <div className="text-xs text-muted-foreground">Niveau</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{playerProfile?.experience_points || 0}</div>
                  <div className="text-xs text-muted-foreground">XP Total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                  <div className="text-2xl font-bold">{playerProfile?.credits || 0}</div>
                  <div className="text-xs text-muted-foreground">Crédits</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                  <Award className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{playerProfile?.total_quests_completed || 0}</div>
                  <div className="text-xs text-muted-foreground">Quêtes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={fetchStats} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser les statistiques
          </Button>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Separator />
      <div className="flex justify-center">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}