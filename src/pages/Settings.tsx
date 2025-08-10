import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Key, 
  Shield,
  Smartphone,
  Moon,
  Sun,
  Globe,
  Clock,
  Volume2,
  VolumeX,
  Crown,
  Zap,
  Brain,
  Target,
  Trophy
} from "lucide-react";

export default function Settings() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gemini_api_key: "",
    notifications_enabled: true,
    sound_enabled: true,
    dark_mode: false,
    language: "fr",
    theme: "system",
    clock_format: "24h",
    focus_mode: false
  });

  const [stats, setStats] = useState({
    tasks_completed: 0,
    habits_tracked: 0,
    focus_sessions: 0,
    streak_days: 0,
    karma_points: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        setFormData({
          gemini_api_key: data.gemini_api_key || "",
          notifications_enabled: data.notifications_enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          dark_mode: data.dark_mode ?? false,
          language: data.language || "fr",
          theme: data.theme || "system",
          clock_format: data.clock_format || "24h",
          focus_mode: data.focus_mode ?? false
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Récupérer les statistiques utilisateur
      const [tasksResult, habitsResult, focusResult] = await Promise.allSettled([
        supabase.from('tasks').select('id').eq('user_id', user.id).eq('completed', true),
        supabase.from('habits').select('id, streak').eq('user_id', user.id),
        supabase.from('focus_sessions').select('id').eq('user_id', user.id)
      ]);

      const tasksCount = tasksResult.status === 'fulfilled' ? (tasksResult.value.data?.length || 0) : 0;
      const habitsCount = habitsResult.status === 'fulfilled' ? (habitsResult.value.data?.length || 0) : 0;
      const focusCount = focusResult.status === 'fulfilled' ? (focusResult.value.data?.length || 0) : 0;
      const maxStreak = habitsResult.status === 'fulfilled' 
        ? Math.max(...(habitsResult.value.data?.map(h => h.streak || 0) || [0]))
        : 0;

      setStats({
        tasks_completed: tasksCount,
        habits_tracked: habitsCount,
        focus_sessions: focusCount,
        streak_days: maxStreak,
        karma_points: userProfile?.karma_points || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Paramètres sauvegardés avec succès!");
      fetchUserProfile();
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeForStat = (statName: string, value: number) => {
    const badges = {
      tasks_completed: [
        { min: 100, label: "🏆 Maître des Tâches", color: "bg-yellow-500" },
        { min: 50, label: "⭐ Expert Productif", color: "bg-blue-500" },
        { min: 20, label: "🎯 Organisé", color: "bg-green-500" },
        { min: 5, label: "🚀 Débutant Motivé", color: "bg-purple-500" }
      ],
      habits_tracked: [
        { min: 10, label: "🧘 Gourou des Habitudes", color: "bg-orange-500" },
        { min: 5, label: "💪 Discipliné", color: "bg-red-500" },
        { min: 2, label: "🌱 En Croissance", color: "bg-teal-500" }
      ],
      focus_sessions: [
        { min: 100, label: "🧠 Maître du Focus", color: "bg-indigo-500" },
        { min: 50, label: "🎯 Concentré", color: "bg-purple-500" },
        { min: 10, label: "⚡ Focalisé", color: "bg-blue-500" }
      ],
      streak_days: [
        { min: 30, label: "🔥 Série Légendaire", color: "bg-red-600" },
        { min: 14, label: "💎 Constance Diamant", color: "bg-blue-600" },
        { min: 7, label: "⚡ Une Semaine Parfaite", color: "bg-green-600" }
      ]
    };

    const statBadges = badges[statName as keyof typeof badges] || [];
    const earnedBadge = statBadges.find(badge => value >= badge.min);
    return earnedBadge || null;
  };

  

  return (
    <div className="flex min-h-screen bg-background">
      <div className="md:hidden">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-auto">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl md:text-3xl font-bold">Paramètres</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API & IA
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations du Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div>
                  <Label>ID Utilisateur</Label>
                  <Input value={user?.id || ""} disabled className="font-mono text-xs" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span>Points Karma</span>
                  </div>
                  <Badge variant="secondary">{stats.karma_points}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Notifications activées</Label>
                    <Switch
                      checked={formData.notifications_enabled}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, notifications_enabled: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Sons activés</Label>
                    <Switch
                      checked={formData.sound_enabled}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, sound_enabled: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Apparence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Thème</Label>
                    <Select
                      value={formData.theme}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, theme: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Clair
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Sombre
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Système
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Langue</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Français
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            English
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Configuration IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Clé API Gemini</Label>
                  <Input
                    type="password"
                    value={formData.gemini_api_key}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, gemini_api_key: e.target.value }))
                    }
                    placeholder="Entrez votre clé API Gemini..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Nécessaire pour les fonctionnalités d'analyse IA avancées
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mode Focus IA</Label>
                  <Switch
                    checked={formData.focus_mode}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, focus_mode: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tâches Complétées</p>
                      <p className="text-2xl font-bold text-green-600">{stats.tasks_completed}</p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  {getBadgeForStat('tasks_completed', stats.tasks_completed) && (
                    <Badge className="mt-2" variant="secondary">
                      {getBadgeForStat('tasks_completed', stats.tasks_completed)?.label}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Habitudes Suivies</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.habits_tracked}</p>
                    </div>
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  {getBadgeForStat('habits_tracked', stats.habits_tracked) && (
                    <Badge className="mt-2" variant="secondary">
                      {getBadgeForStat('habits_tracked', stats.habits_tracked)?.label}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions Focus</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.focus_sessions}</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  {getBadgeForStat('focus_sessions', stats.focus_sessions) && (
                    <Badge className="mt-2" variant="secondary">
                      {getBadgeForStat('focus_sessions', stats.focus_sessions)?.label}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Série Maximale</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.streak_days}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-orange-600" />
                  </div>
                  {getBadgeForStat('streak_days', stats.streak_days) && (
                    <Badge className="mt-2" variant="secondary">
                      {getBadgeForStat('streak_days', stats.streak_days)?.label}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Sauvegarde..." : "Sauvegarder les Paramètres"}
          </Button>
        </div>
      </div>
    </div>
  );
}
