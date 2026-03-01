import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useDesignMode } from "@/contexts/DesignModeContext";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { useAICredits } from "@/hooks/useAICredits";
import { useSubscription } from "@/hooks/useSubscription";
import { Link, useSearchParams } from "react-router-dom";
import { PremiumUpgradeCard } from "@/components/PremiumUpgradeCard";
import { ProfileEditForm } from "@/components/settings/ProfileEditForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  Apple,
  Wand2,
  Info,
  Mail,
  Copy,
  ExternalLink,
  FileText,
  Shield,
  HelpCircle,
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
  const { designMode, setDesignMode } = useDesignMode();
  const { profile: playerProfile } = usePenguinProfile();
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

  const [userProfile, setUserProfile] = useState<{ display_name: string | null; photo_url: string | null } | null>(null);

  // Handle PayPal return
  useEffect(() => {
    const handlePayPalReturn = async () => {
      const payment = searchParams.get("payment");
      const token = searchParams.get("token");
      if (payment === "success" && token) {
        try { await capturePayPalOrder(token); } catch (error) { console.error("Error capturing PayPal order:", error); }
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
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select('display_name, photo_url').eq('id', user.id).maybeSingle();
    if (data) setUserProfile(data);
  };

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('user_settings').select('*').eq('id', user.id).maybeSingle();
      if (error && error.code !== 'PGRST116') { console.error('Settings fetch error:', error); return; }
      if (data) {
        setFormData({
          notifications_enabled: data.notifications_enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          focus_mode: data.focus_mode ?? false
        });
      }
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

  // Auto-save preferences
  const autoSavePreferences = useCallback(async (newFormData: typeof formData) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_settings').upsert({
        id: user.id,
        ...newFormData,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("Préférences sauvegardées");
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  }, [user]);

  const updatePreference = (key: keyof typeof formData, value: boolean) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);
    autoSavePreferences(newFormData);
  };

  const handleLogout = async () => {
    try { await signOut(); toast.success("Déconnexion réussie"); } catch (error) { toast.error("Erreur lors de la déconnexion"); }
  };

  const stageLabel = playerProfile?.stage === 'emperor' ? 'Empereur' : playerProfile?.stage === 'explorer' ? 'Explorateur' : playerProfile?.stage === 'chick' ? 'Poussin' : 'Œuf';
  const currentXPProgress = 0;

  const copyEmail = () => {
    navigator.clipboard.writeText("deepflow.ia@gmail.com");
    toast.success("Email copié !");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">Paramètres</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
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
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">À propos</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Quick Profile Overview */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={userProfile?.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold">
                      {userProfile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-lg">{userProfile?.display_name || user?.email}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>🐧 {stageLabel}</span>
                      <span>•</span>
                      <span>🐟 {playerProfile?.salmon_total || 0} saumons</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/gamification"><Trophy className="h-4 w-4 mr-2" />Arène</Link>
                  </Button>
                </div>
              </div>
              {playerProfile && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>🐧 {stageLabel}</span>
                    <span>🦐 {playerProfile.shrimp_total} | 🐟 {playerProfile.salmon_total} | ✨🐠 {playerProfile.golden_fish_total}</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
          <ProfileEditForm />
          <PremiumUpgradeCard />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Apparence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Palette className="h-5 w-5" />Apparence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <div className="flex gap-2">
                    <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')} className="flex-1">
                      <Sun className="h-4 w-4 mr-2" />Clair
                    </Button>
                    <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')} className="flex-1">
                      <Moon className="h-4 w-4 mr-2" />Sombre
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Style de design</Label>
                  <div className="flex gap-2">
                    <Button variant={designMode === 'futuristic' ? 'default' : 'outline'} size="sm" onClick={() => { setDesignMode('futuristic'); toast.success("Design Futuriste activé"); }} className="flex-1">
                      <Wand2 className="h-4 w-4 mr-2" />Futuriste
                    </Button>
                    <Button variant={designMode === 'apple' ? 'default' : 'outline'} size="sm" onClick={() => { setDesignMode('apple'); toast.success("Design Apple activé"); }} className="flex-1">
                      <Apple className="h-4 w-4 mr-2" />Minimal
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {designMode === 'apple' ? "Interface épurée inspirée d'Apple : espaces généreux, ombres légères, sans effets." : "Interface moderne avec effets de verre, animations et dégradés."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5" />Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Notifications push</span></div>
                  <Switch
                    checked={formData.notifications_enabled}
                    onCheckedChange={async (checked) => {
                      if (checked && 'Notification' in window) {
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                          toast.error("Notifications bloquées par le navigateur");
                          return;
                        }
                      }
                      updatePreference('notifications_enabled', checked);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Sons</span></div>
                  <Switch checked={formData.sound_enabled} onCheckedChange={(checked) => updatePreference('sound_enabled', checked)} />
                </div>
              </CardContent>
            </Card>

            {/* Focus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5" />Productivité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Mode Focus (Ne pas déranger)</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Désactive les notifications pendant les sessions</p>
                  </div>
                  <Switch checked={formData.focus_mode} onCheckedChange={(checked) => updatePreference('focus_mode', checked)} />
                </div>
              </CardContent>
            </Card>

            {/* Crédits IA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5" />Crédits IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-2xl font-bold text-primary">{aiCredits === Infinity ? "∞" : aiCredits}</div>
                    <p className="text-xs text-muted-foreground">crédits disponibles</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/gamification"><Gamepad2 className="h-4 w-4 mr-2" />Boutique</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Statistiques</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gamepad2 className="h-5 w-5" />Progression Gamification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-xl border border-sky-500/20">
                  <span className="text-2xl block mb-1">🐧</span>
                  <div className="text-2xl font-bold">{stageLabel}</div>
                  <div className="text-xs text-muted-foreground">Stade</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-rose-500/10 rounded-xl border border-orange-500/20">
                  <span className="text-2xl block mb-1">🦐</span>
                  <div className="text-2xl font-bold">{playerProfile?.shrimp_total || 0}</div>
                  <div className="text-xs text-muted-foreground">Crevettes</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl border border-rose-500/20">
                  <span className="text-2xl block mb-1">🐟</span>
                  <div className="text-2xl font-bold">{playerProfile?.salmon_total || 0}</div>
                  <div className="text-xs text-muted-foreground">Saumons</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20">
                  <span className="text-2xl block mb-1">✨🐠</span>
                  <div className="text-2xl font-bold">{playerProfile?.golden_fish_total || 0}</div>
                  <div className="text-xs text-muted-foreground">Poissons Dorés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={fetchStats} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser les statistiques
          </Button>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          {/* Mentions légales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Mentions Légales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div><strong className="text-foreground">Éditeur :</strong> DeepFlow</div>
              <div><strong className="text-foreground">Email de contact :</strong> deepflow.ia@gmail.com</div>
              <div><strong className="text-foreground">Hébergement :</strong> Supabase (infrastructure) / Lovable (frontend)</div>
              <div><strong className="text-foreground">Pays :</strong> France 🇫🇷</div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/legal/privacy"><FileText className="h-4 w-4 mr-1" />Confidentialité</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/legal/terms"><FileText className="h-4 w-4 mr-1" />CGU</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/legal/cookies"><FileText className="h-4 w-4 mr-1" />Cookies</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />Foire Aux Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="1">
                  <AccordionTrigger>Comment fonctionne DeepFlow ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    DeepFlow est une application de productivité augmentée par l'IA. Elle combine gestion de tâches, suivi d'habitudes, sessions de focus, journaling et gamification pour vous aider à atteindre vos objectifs. L'IA analyse vos données pour fournir des insights personnalisés.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="2">
                  <AccordionTrigger>Qu'est-ce que les crédits IA ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Les crédits IA vous permettent d'utiliser les fonctionnalités d'intelligence artificielle (analyse, chat, suggestions). Chaque requête IA consomme des crédits. Vous recevez des crédits de départ et pouvez en gagner via la boutique de la Cyber Arena.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="3">
                  <AccordionTrigger>Comment gagner des crédits de jeu ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Vous gagnez des crédits de jeu en complétant des quêtes quotidières et hebdomadaires, en montant de niveau, et en maintenant des séries (streaks) d'habitudes. Ces crédits servent à acheter des power-ups et des packs de crédits IA dans la boutique.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="4">
                  <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Oui. Vos données sont stockées de manière sécurisée avec Supabase, qui utilise le chiffrement en transit et au repos. L'authentification est gérée de manière sécurisée et vos données personnelles ne sont jamais partagées avec des tiers sans votre consentement.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="5">
                  <AccordionTrigger>Comment contacter le support ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Envoyez un email à <strong>deepflow.ia@gmail.com</strong> pour toute question, suggestion ou problème. Nous répondons généralement sous 48h.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="6">
                  <AccordionTrigger>Puis-je utiliser DeepFlow hors ligne ?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    DeepFlow dispose d'un mode hors ligne partiel grâce au Service Worker (PWA). Vous pouvez consulter certaines données en cache et créer des éléments hors ligne. La synchronisation se fait automatiquement lorsque la connexion est rétablie.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Nous Contacter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-medium">deepflow.ia@gmail.com</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={copyEmail} title="Copier">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild title="Envoyer un email">
                    <a href="mailto:deepflow.ia@gmail.com"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">v1.0.0</Badge>
            <span>•</span>
            <span>🇫🇷 Made in France</span>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Separator />
      <div className="flex justify-center">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />Déconnexion
        </Button>
      </div>
    </div>
  );
}
