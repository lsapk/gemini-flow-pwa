
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Crown,
  Key
} from "lucide-react";
import { useTheme } from "next-themes";
import { enableAdminMode, disableAdminMode, isAdminModeEnabled } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserProfile, UserSettings } from "@/types";

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (user) {
      loadUserData();
      setIsAdmin(isAdminModeEnabled());
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || "");
        setBio(profileData.bio || "");
      }

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading settings:', settingsError);
      } else if (settingsData) {
        // Transform the data to match our interface
        const transformedSettings: UserSettings = {
          ...settingsData,
          unlocked_features: Array.isArray(settingsData.unlocked_features) 
            ? settingsData.unlocked_features 
            : []
        };
        setSettings(transformedSettings);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données utilisateur.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const profileData = {
        id: user.id,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        email: user.email,
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profil sauvegardé",
        description: "Vos informations ont été mises à jour avec succès.",
      });
      
      loadUserData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!user || !settings) return;

    try {
      const updatedSettings = { ...settings, [key]: value };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({ ...updatedSettings, id: user.id });

      if (error) throw error;

      setSettings(updatedSettings);
      toast({
        title: "Paramètre mis à jour",
        description: "Le paramètre a été sauvegardé avec succès.",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre.",
        variant: "destructive",
      });
    }
  };

  const handleAdminToggle = async () => {
    if (isAdmin) {
      disableAdminMode();
      setIsAdmin(false);
      toast({
        title: "Mode admin désactivé",
        description: "Vous n'êtes plus en mode administrateur.",
      });
    } else {
      setIsAdminDialogOpen(true);
    }
  };

  const verifyAdminCode = async () => {
    const success = await enableAdminMode(adminCode);
    if (success) {
      setIsAdmin(true);
      setIsAdminDialogOpen(false);
      setAdminCode("");
      toast({
        title: "Mode admin activé",
        description: "Vous êtes maintenant en mode administrateur.",
      });
    } else {
      toast({
        title: "Code incorrect",
        description: "Le code administrateur est incorrect.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl sm:text-3xl font-bold">Paramètres</h1>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Profil utilisateur</CardTitle>
          {isAdmin && <Badge variant="destructive" className="ml-auto"><Crown className="h-3 w-3 mr-1" />Admin</Badge>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom d'affichage"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez-nous de vous..."
            />
          </div>

          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Thème</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un thème" />
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
                    <Monitor className="h-4 w-4" />
                    Système
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Langue</Label>
            <Select 
              value={settings?.language || 'fr'} 
              onValueChange={(value) => updateSetting('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format d'heure</Label>
            <Select 
              value={settings?.clock_format || '24h'} 
              onValueChange={(value) => updateSetting('clock_format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h (14:30)</SelectItem>
                <SelectItem value="12h">12h (2:30 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications activées</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications sur l'application
              </p>
            </div>
            <Switch
              checked={settings?.notifications_enabled ?? true}
              onCheckedChange={(checked) => updateSetting('notifications_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Sons activés
              </Label>
              <p className="text-sm text-muted-foreground">
                Jouer des sons pour les notifications
              </p>
            </div>
            <Switch
              checked={settings?.sound_enabled ?? true}
              onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Productivity Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Globe className="h-5 w-5" />
          <CardTitle>Productivité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode focus</Label>
              <p className="text-sm text-muted-foreground">
                Masquer les distractions pendant les sessions de travail
              </p>
            </div>
            <Switch
              checked={settings?.focus_mode ?? false}
              onCheckedChange={(checked) => updateSetting('focus_mode', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Points Karma</Label>
            <div className="flex items-center gap-2">
              <div className="h-2 w-full bg-muted rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((settings?.karma_points || 0) / 1000 * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium">{settings?.karma_points || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Administration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Mode administrateur
              </Label>
              <p className="text-sm text-muted-foreground">
                Accès aux fonctions d'administration
              </p>
            </div>
            <Switch
              checked={isAdmin}
              onCheckedChange={handleAdminToggle}
            />
          </div>

          <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Code administrateur
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminCode">Entrez le code administrateur</Label>
                  <Input
                    id="adminCode"
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Code administrateur"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        verifyAdminCode();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={verifyAdminCode} className="flex-1">
                    Vérifier
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAdminDialogOpen(false);
                      setAdminCode("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Separator />

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Déconnexion</h3>
              <p className="text-sm text-muted-foreground">
                Se déconnecter de votre compte
              </p>
              <Button variant="outline" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
