
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SettingsIcon, BellIcon, MoonIcon, ComputerIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getUserSettings, updateUserSettings } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";

type UserSettings = {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  focus_mode: boolean;
  theme: string;
  language: string;
  clock_format: string;
};

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await getUserSettings();
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          setSettings(data as UserSettings);
          // Set theme in the theme provider based on user settings
          if (data.theme && (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system')) {
            setTheme(data.theme as "light" | "dark" | "system");
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos paramètres.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user, toast, setTheme]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const { error } = await updateUserSettings(settings);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour.",
      });
      
      // Update theme in the theme provider
      if (settings.theme && (settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'system')) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Personnalisez l'application selon vos préférences.
          </p>
        </div>
        
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Personnalisez l'application selon vos préférences.
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configurez les options principales de l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language selection */}
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select 
                  value={settings?.language || 'fr'} 
                  onValueChange={(value) => handleSettingChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Clock format */}
              <div className="space-y-2">
                <Label>Format de l'horloge</Label>
                <RadioGroup 
                  value={settings?.clock_format || '24h'} 
                  onValueChange={(value) => handleSettingChange('clock_format', value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="12h" />
                    <Label htmlFor="12h">12 heures (AM/PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="24h" />
                    <Label htmlFor="24h">24 heures</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Focus Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode Focus</Label>
                  <p className="text-sm text-muted-foreground">
                    Activez le mode Focus pour éliminer les distractions pendant vos sessions de concentration.
                  </p>
                </div>
                <Switch 
                  checked={settings?.focus_mode || false}
                  onCheckedChange={(value) => handleSettingChange('focus_mode', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configurez vos préférences de notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4" />
                    Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activez ou désactivez toutes les notifications.
                  </p>
                </div>
                <Switch 
                  checked={settings?.notifications_enabled || false}
                  onCheckedChange={(value) => handleSettingChange('notifications_enabled', value)}
                />
              </div>
              
              {/* Sounds */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sons</Label>
                  <p className="text-sm text-muted-foreground">
                    Activez ou désactivez les sons de notification.
                  </p>
                </div>
                <Switch 
                  checked={settings?.sound_enabled || false}
                  onCheckedChange={(value) => handleSettingChange('sound_enabled', value)}
                  disabled={!settings?.notifications_enabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label>Thème</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={settings?.theme === 'light' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center gap-2 h-20"
                    onClick={() => handleSettingChange('theme', 'light')}
                  >
                    <SunIcon className="h-5 w-5" />
                    <span>Clair</span>
                  </Button>
                  
                  <Button 
                    variant={settings?.theme === 'dark' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center gap-2 h-20"
                    onClick={() => handleSettingChange('theme', 'dark')}
                  >
                    <MoonIcon className="h-5 w-5" />
                    <span>Sombre</span>
                  </Button>
                  
                  <Button 
                    variant={settings?.theme === 'system' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center gap-2 h-20"
                    onClick={() => handleSettingChange('theme', 'system')}
                  >
                    <ComputerIcon className="h-5 w-5" />
                    <span>Système</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saving || !settings}
          className="min-w-[120px]"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
