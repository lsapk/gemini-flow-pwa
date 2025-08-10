
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Download,
  Trash2,
  Moon,
  Sun,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Paramètres utilisateur
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    emailNotifications: true,
    dailyReminders: true,
    weeklyReports: false,
    soundEnabled: true,
    darkMode: theme === 'dark',
    language: 'fr',
    timezone: 'Europe/Paris',
    privacyMode: false,
    dataSharing: false
  });

  // Paramètres de compte
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Statistiques
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalHabits: 0,
    totalGoals: 0,
    totalJournalEntries: 0,
    totalFocusTime: 0,
    accountCreated: ''
  });

  useEffect(() => {
    if (user) {
      loadUserSettings();
      loadUserStats();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (data) {
        setUserSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      const [tasks, habits, goals, journal, focus] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('habits').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('goals').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('journal_entries').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('focus_sessions').select('duration').eq('user_id', user.id)
      ]);

      const totalFocusTime = focus.data?.reduce((sum, session) => sum + session.duration, 0) || 0;

      setStats({
        totalTasks: tasks.count || 0,
        totalHabits: habits.count || 0,
        totalGoals: goals.count || 0,
        totalJournalEntries: journal.count || 0,
        totalFocusTime: Math.round(totalFocusTime / 60), // en heures
        accountCreated: user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user?.id,
          settings: userSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Paramètres sauvegardés !");
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (accountData.newPassword !== accountData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (accountData.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: accountData.newPassword
      });

      if (error) throw error;
      
      setAccountData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      toast.success("Mot de passe modifié !");
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      const [tasks, habits, goals, journal, focus] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user?.id),
        supabase.from('habits').select('*').eq('user_id', user?.id),
        supabase.from('goals').select('*').eq('user_id', user?.id),
        supabase.from('journal_entries').select('*').eq('user_id', user?.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user?.id)
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user?.id,
        tasks: tasks.data,
        habits: habits.data,
        goals: goals.data,
        journal_entries: journal.data,
        focus_sessions: focus.data
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `deepflow-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success("Données exportées !");
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      return;
    }

    if (!confirm("Dernière confirmation : toutes vos données seront définitivement perdues.")) {
      return;
    }

    setLoading(true);
    try {
      // Supprimer toutes les données utilisateur
      await Promise.all([
        supabase.from('tasks').delete().eq('user_id', user?.id),
        supabase.from('habits').delete().eq('user_id', user?.id),
        supabase.from('goals').delete().eq('user_id', user?.id),
        supabase.from('journal_entries').delete().eq('user_id', user?.id),
        supabase.from('focus_sessions').delete().eq('user_id', user?.id)
      ]);

      toast.success("Compte supprimé");
      await signOut();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
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
      
      <div className="flex-1 p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Paramètres</h1>
        </div>

        {/* Statistiques du compte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Aperçu du compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Tâches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalHabits}</div>
                <div className="text-sm text-muted-foreground">Habitudes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalGoals}</div>
                <div className="text-sm text-muted-foreground">Objectifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.totalJournalEntries}</div>
                <div className="text-sm text-muted-foreground">Journal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.totalFocusTime}h</div>
                <div className="text-sm text-muted-foreground">Focus</div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center text-sm">
              <span>Compte créé le</span>
              <Badge variant="outline">{stats.accountCreated}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications dans l'app</p>
              </div>
              <Switch
                checked={userSettings.notifications}
                onCheckedChange={(checked) => 
                  setUserSettings(prev => ({ ...prev, notifications: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications email</Label>
                <p className="text-sm text-muted-foreground">Recevoir des emails de rappel</p>
              </div>
              <Switch
                checked={userSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setUserSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Rappels quotidiens</Label>
                <p className="text-sm text-muted-foreground">Rappel pour vos habitudes</p>
              </div>
              <Switch
                checked={userSettings.dailyReminders}
                onCheckedChange={(checked) => 
                  setUserSettings(prev => ({ ...prev, dailyReminders: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Rapports hebdomadaires</Label>
                <p className="text-sm text-muted-foreground">Résumé de votre semaine</p>
              </div>
              <Switch
                checked={userSettings.weeklyReports}
                onCheckedChange={(checked) => 
                  setUserSettings(prev => ({ ...prev, weeklyReports: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Thème sombre</Label>
                <p className="text-sm text-muted-foreground">Mode sombre pour l'interface</p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => {
                    setTheme(checked ? 'dark' : 'light');
                    setUserSettings(prev => ({ ...prev, darkMode: checked }));
                  }}
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Sons</Label>
                <p className="text-sm text-muted-foreground">Sons pour les notifications</p>
              </div>
              <Switch
                checked={userSettings.soundEnabled}
                onCheckedChange={(checked) => 
                  setUserSettings(prev => ({ ...prev, soundEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Sécurité et Compte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité et Compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={accountData.email}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium">Changer le mot de passe</h4>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={accountData.newPassword}
                    onChange={(e) => setAccountData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Nouveau mot de passe"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmer le mot de passe"
                />
              </div>
              <Button 
                onClick={changePassword} 
                disabled={loading || !accountData.newPassword || !accountData.confirmPassword}
                size="sm"
              >
                <Lock className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confidentialité et Données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Confidentialité et Données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode privé</Label>
                <p className="text-sm text-muted-foreground">Masquer vos données sensibles</p>
              </div>
              <Switch
                checked={userSettings.privacyMode}
                onCheckedChange={(checked) => 
                  setUserSettings(prev => ({ ...prev, privacyMode: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button onClick={exportData} disabled={loading} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exporter mes données
              </Button>
              <p className="text-xs text-muted-foreground">
                Téléchargez toutes vos données au format JSON
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={saveSettings} disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les paramètres
          </Button>
          
          <Button 
            onClick={deleteAccount} 
            disabled={loading} 
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer le compte
          </Button>
        </div>
      </div>
    </div>
  );
}
