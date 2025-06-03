
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Globe,
  Shield,
  Loader2,
  Check,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { enableAdminMode, disableAdminMode, isAdminModeEnabled } from "@/lib/api";

interface UserProfile {
  display_name: string;
  email: string;
  bio: string;
  photo_url: string;
}

interface UserSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  focus_mode: boolean;
  theme: string;
  language: string;
  clock_format: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile>({
    display_name: "",
    email: "",
    bio: "",
    photo_url: ""
  });
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    sound_enabled: true,
    focus_mode: false,
    theme: "system",
    language: "fr",
    clock_format: "24h"
  });
  const [adminCode, setAdminCode] = useState("");
  const [isAdminEnabled, setIsAdminEnabled] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSettings();
    }
    setIsAdminEnabled(isAdminModeEnabled());
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          email: data.email || user.email || "",
          bio: data.bio || "",
          photo_url: data.photo_url || ""
        });
      } else {
        // Create profile if it doesn't exist
        setProfile({
          display_name: "",
          email: user.email || "",
          bio: "",
          photo_url: ""
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

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          notifications_enabled: data.notifications_enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          focus_mode: data.focus_mode ?? false,
          theme: data.theme || "system",
          language: data.language || "fr",
          clock_format: data.clock_format || "24h"
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: profile.display_name.trim() || null,
          email: profile.email.trim() || null,
          bio: profile.bio.trim() || null,
          photo_url: profile.photo_url.trim() || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Profil sauvegardé",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsLoadingSettings(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour avec succès.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleAdminCode = async () => {
    if (!adminCode.trim()) return;

    try {
      const success = await enableAdminMode(adminCode.trim());
      if (success) {
        setIsAdminEnabled(true);
        setShowAdminDialog(false);
        setAdminCode("");
        toast({
          title: "Mode administrateur activé",
          description: "Vous avez maintenant accès aux fonctionnalités d'administration.",
        });
      } else {
        toast({
          title: "Code incorrect",
          description: "Le code administrateur est incorrect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'activer le mode administrateur.",
        variant: "destructive",
      });
    }
  };

  const handleDisableAdmin = () => {
    disableAdminMode();
    setIsAdminEnabled(false);
    toast({
      title: "Mode administrateur désactivé",
      description: "Les fonctionnalités d'administration sont maintenant désactivées.",
    });
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
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil et vos préférences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Nom d'affichage</Label>
                <Input
                  id="display-name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Votre nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parlez-nous de vous..."
                rows={3}
              />
            </div>

            <Button 
              onClick={saveProfile} 
              disabled={isLoadingProfile}
              className="w-full sm:w-auto"
            >
              {isLoadingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Sauvegarder le profil
                </>
              )}
            </Button>
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
              <div className="space-y-0.5">
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications pour les rappels et mises à jour
                </p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, notifications_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sons</Label>
                <p className="text-sm text-muted-foreground">
                  Activer les sons pour les notifications
                </p>
              </div>
              <Switch
                checked={settings.sound_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, sound_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode focus</Label>
                <p className="text-sm text-muted-foreground">
                  Réduire les distractions pendant les sessions de travail
                </p>
              </div>
              <Switch
                checked={settings.focus_mode}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, focus_mode: checked }))
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thème</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format de l'heure</Label>
                <Select 
                  value={settings.clock_format} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, clock_format: value }))
                  }
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
              Langue et région
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Langue de l'interface</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
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

        {/* Mode Administrateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Mode Administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Statut administrateur</Label>
                <p className="text-sm text-muted-foreground">
                  {isAdminEnabled ? "Mode administrateur activé" : "Mode administrateur désactivé"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdminEnabled ? (
                  <>
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Actif</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDisableAdmin}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Désactiver
                    </Button>
                  </>
                ) : (
                  <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4 mr-1" />
                        Activer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Activer le mode administrateur</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-code">Code administrateur</Label>
                          <Input
                            id="admin-code"
                            type="password"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            placeholder="Entrez le code administrateur"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminCode()}
                          />
                        </div>
                        <Button onClick={handleAdminCode} className="w-full">
                          Activer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde des paramètres */}
        <div className="flex justify-end">
          <Button 
            onClick={saveSettings} 
            disabled={isLoadingSettings}
            className="w-full sm:w-auto"
          >
            {isLoadingSettings ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
