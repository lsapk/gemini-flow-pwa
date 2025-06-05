
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, User, Bell, Palette, Globe, Shield } from "lucide-react";
import { UserProfile, UserSettings } from "@/types";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    display_name: '',
    email: '',
    photo_url: '',
    bio: ''
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    notifications_enabled: true,
    sound_enabled: true,
    focus_mode: false,
    karma_points: 0,
    unlocked_features: [],
    theme: 'system',
    language: 'fr',
    clock_format: '24h'
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          display_name: user.user_metadata?.display_name || '',
          email: user.email || '',
          photo_url: null,
          bio: null
        };
        
        const { data, error } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (!error && data) {
          setProfile(data);
        }
      }

      // Load user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Create settings if they don't exist
        const newSettings = {
          id: user.id,
          notifications_enabled: true,
          sound_enabled: true,
          focus_mode: false,
          karma_points: 0,
          unlocked_features: [],
          theme: 'system',
          language: 'fr',
          clock_format: '24h'
        };
        
        const { data, error } = await supabase
          .from('user_settings')
          .insert(newSettings)
          .select()
          .single();
          
        if (!error && data) {
          setSettings(data);
        }
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
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil sauvegardé",
        description: "Vos informations de profil ont été mises à jour.",
      });
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

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          notifications_enabled: settings.notifications_enabled,
          sound_enabled: settings.sound_enabled,
          focus_mode: settings.focus_mode,
          theme: settings.theme,
          language: settings.language,
          clock_format: settings.clock_format,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
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

      {/* Profil utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_name">Nom d'affichage</Label>
              <Input
                id="display_name"
                value={profile.display_name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Votre nom d'affichage"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Parlez-nous un peu de vous..."
              rows={3}
            />
          </div>
          
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
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
            <div>
              <Label htmlFor="notifications">Notifications activées</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications pour les rappels et événements
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notifications_enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound">Sons activés</Label>
              <p className="text-sm text-muted-foreground">
                Jouer des sons pour les notifications
              </p>
            </div>
            <Switch
              id="sound"
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sound_enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="focus_mode">Mode focus</Label>
              <p className="text-sm text-muted-foreground">
                Réduire les distractions pendant les sessions de travail
              </p>
            </div>
            <Switch
              id="focus_mode"
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
          <div>
            <Label htmlFor="theme">Thème</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}
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
        </CardContent>
      </Card>

      {/* Langue et région */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Langue et région
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Langue</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="clock_format">Format d'heure</Label>
              <Select
                value={settings.clock_format}
                onValueChange={(value) => setSettings(prev => ({ ...prev, clock_format: value }))}
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

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vos statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{settings.karma_points}</p>
              <p className="text-sm text-muted-foreground">Points Karma</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{settings.unlocked_features?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Fonctionnalités débloquées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde global */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? "Sauvegarde..." : "Sauvegarder tous les paramètres"}
        </Button>
      </div>
    </div>
  );
}
