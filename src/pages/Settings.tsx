
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Clock,
  Shield,
  Globe,
  Save
} from "lucide-react";

export default function Settings() {
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    email: ""
  });
  
  const [settings, setSettings] = useState({
    theme: "system",
    language: "fr",
    notifications_enabled: true,
    sound_enabled: true,
    focus_mode: false,
    clock_format: "24h"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSettings();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          bio: data.bio || "",
          email: data.email || ""
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setSettings({
          theme: data.theme || "system",
          language: data.language || "fr",
          notifications_enabled: data.notifications_enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          focus_mode: data.focus_mode ?? false,
          clock_format: data.clock_format || "24h"
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations de profil ont été sauvegardées.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Paramètres mis à jour",
        description: "Vos préférences ont été sauvegardées.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const makeAdmin = async () => {
    if (!user || adminCode !== "deepflow2024") return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'admin'
        });
      
      if (error) throw error;
      
      setIsAdmin(true);
      setAdminCode("");
      toast({
        title: "Accès administrateur accordé",
        description: "Vous avez maintenant les privilèges administrateur.",
      });
    } catch (error) {
      console.error('Error granting admin access:', error);
      toast({
        title: "Erreur",
        description: "Code administrateur incorrect.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <SettingsIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Paramètres</h3>
            <p className="text-muted-foreground">
              Veuillez vous connecter pour accéder aux paramètres.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez votre profil et personnalisez votre expérience
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="display_name">Nom d'affichage</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({...prev, display_name: e.target.value}))}
                  placeholder="Votre nom d'affichage"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({...prev, email: e.target.value}))}
                  placeholder="votre@email.com"
                  type="email"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({...prev, bio: e.target.value}))}
                  placeholder="Décrivez-vous en quelques mots..."
                  rows={3}
                />
              </div>
            </div>
            
            <Button onClick={saveProfile} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder le profil
            </Button>
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
            <div className="grid gap-4">
              <div>
                <Label>Thème</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => setSettings(prev => ({...prev, theme: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Format d'heure</Label>
                <Select 
                  value={settings.clock_format} 
                  onValueChange={(value) => setSettings(prev => ({...prev, clock_format: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 heures</SelectItem>
                    <SelectItem value="24h">24 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Langue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Langue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Langue de l'interface</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => setSettings(prev => ({...prev, language: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
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
                <Label>Notifications activées</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications pour les rappels</p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({...prev, notifications_enabled: checked}))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Sons activés</Label>
                <p className="text-sm text-muted-foreground">Jouer des sons pour les notifications</p>
              </div>
              <Switch
                checked={settings.sound_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({...prev, sound_enabled: checked}))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode focus</Label>
                <p className="text-sm text-muted-foreground">Réduire les distractions pendant le travail</p>
              </div>
              <Switch
                checked={settings.focus_mode}
                onCheckedChange={(checked) => setSettings(prev => ({...prev, focus_mode: checked}))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Administration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Administration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  ✅ Vous avez les privilèges administrateur
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Vous pouvez gérer les commentaires et modérer le contenu des bonnes actions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="admin_code">Code administrateur</Label>
                  <Input
                    id="admin_code"
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Entrez le code administrateur"
                  />
                </div>
                <Button 
                  onClick={makeAdmin}
                  disabled={!adminCode.trim()}
                  variant="outline"
                >
                  Activer les privilèges admin
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={saveSettings} disabled={isLoading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder tous les paramètres
        </Button>
      </div>
    </div>
  );
}
