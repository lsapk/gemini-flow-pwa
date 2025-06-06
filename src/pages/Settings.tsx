
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeProductivityScore } from "@/hooks/useRealtimeProductivityScore";
import { Settings, Palette, Bell, Globe, Award, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  focus_mode: boolean;
  language: string;
  clock_format: string;
  karma_points: number;
  unlocked_features: string[];
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productivityData = useRealtimeProductivityScore();

  // Charger les paramètres utilisateur
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['userSettings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    }
  });

  const updateSetting = (key: keyof UserSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Gestion sécurisée des badges
  const badges = Array.isArray(productivityData.badges) ? productivityData.badges : [];
  const unlockedFeatures = Array.isArray(userSettings?.unlocked_features) 
    ? userSettings.unlocked_features as string[]
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Thème</label>
              <Select value={theme} onValueChange={setTheme}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Format d'heure</label>
              <Select
                value={userSettings?.clock_format || '24h'}
                onValueChange={(value) => updateSetting('clock_format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="12h">12 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Langue</label>
              <Select
                value={userSettings?.language || 'fr'}
                onValueChange={(value) => updateSetting('language', value)}
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
                <p className="font-medium">Notifications activées</p>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications pour les rappels
                </p>
              </div>
              <Switch
                checked={userSettings?.notifications_enabled ?? true}
                onCheckedChange={(checked) => updateSetting('notifications_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sons activés</p>
                <p className="text-sm text-muted-foreground">
                  Jouer des sons pour les notifications
                </p>
              </div>
              <Switch
                checked={userSettings?.sound_enabled ?? true}
                onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mode focus</p>
                <p className="text-sm text-muted-foreground">
                  Réduire les distractions en mode focus
                </p>
              </div>
              <Switch
                checked={userSettings?.focus_mode ?? false}
                onCheckedChange={(checked) => updateSetting('focus_mode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistiques de productivité */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiques de productivité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {productivityData.score}
                </div>
                <p className="text-sm font-medium">Score de productivité</p>
                <Badge variant="secondary" className="mt-1">
                  {productivityData.level}
                </Badge>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round(productivityData.completionRate)}%
                </div>
                <p className="text-sm font-medium">Taux de complétion</p>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {userSettings?.karma_points || 0}
                </div>
                <p className="text-sm font-medium">Points karma</p>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Badges obtenus
                </h4>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 6).map((badge, index) => (
                    <Badge key={index} variant="outline">
                      {badge}
                    </Badge>
                  ))}
                  {badges.length > 6 && (
                    <Badge variant="secondary">
                      +{badges.length - 6} autres
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fonctionnalités débloquées */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Fonctionnalités débloquées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {unlockedFeatures.map((feature, index) => (
                <Badge key={index} variant="default" className="justify-center">
                  {feature}
                </Badge>
              ))}
              {unlockedFeatures.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-4">
                  Aucune fonctionnalité débloquée pour le moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
