
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Bell, Moon, Sun, Shield } from "lucide-react";

export default function Settings() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserSettings();
      checkAdminStatus();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      const { data: settings } = await supabase
        .from('user_settings')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || '');
        setEmail(profile.email || user.email || '');
      }

      if (settings) {
        setNotifications(settings.notifications_enabled);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      // Pas d'erreur si l'utilisateur n'est pas admin
      setIsAdmin(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          email: email
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil mis à jour avec succès!');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ notifications_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setNotifications(enabled);
      toast.success('Paramètres de notification mis à jour!');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        {isAdmin && (
          <Badge variant="secondary" className="ml-2">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )}
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
          <div className="space-y-2">
            <Label htmlFor="displayName">Nom d'affichage</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom d'affichage"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          <Button onClick={saveProfile} disabled={loading}>
            {loading ? 'Mise à jour...' : 'Sauvegarder le profil'}
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
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications push</Label>
              <div className="text-sm text-muted-foreground">
                Recevoir des notifications pour les rappels et les mises à jour
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={saveNotificationSettings}
            />
          </div>
        </CardContent>
      </Card>

      {/* Apparence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Apparence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode sombre</Label>
              <div className="text-sm text-muted-foreground">
                Activer le thème sombre pour une meilleure expérience dans l'obscurité
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres admin (seulement si admin) */}
      {isAdmin && (
        <>
          <Separator />
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Shield className="h-5 w-5" />
                Paramètres Administrateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Vous avez accès aux fonctionnalités administrateur de l'application.
                </div>
                <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                  Gérer les utilisateurs
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Informations de compte */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>ID utilisateur: {user?.id}</p>
            <p>Compte créé: {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
            <p>Statut: {isAdmin ? 'Administrateur' : 'Utilisateur'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
