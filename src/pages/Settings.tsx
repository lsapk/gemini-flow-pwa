
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  User, Bell, Shield, Eye, EyeOff, Key, 
  Smartphone, Download, Trash2, AlertTriangle,
  Moon, Sun, Monitor, Lock, Mail, Database
} from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: 'system',
    language: 'fr',
    clockFormat: '24h',
    soundEnabled: true,
    focusMode: false,
    emailNotifications: true,
    pushNotifications: true,
    dataBackup: true,
    twoFactorAuth: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: user?.email || ''
  });

  const [profileSettings, setProfileSettings] = useState({
    displayName: '',
    bio: ''
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user?.id,
          notifications_enabled: settings.notifications,
          theme: settings.darkMode,
          language: settings.language,
          clock_format: settings.clockFormat,
          sound_enabled: settings.soundEnabled,
          focus_mode: settings.focusMode,
        });

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: securitySettings.newPassword
      });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });

      setSecuritySettings({
        ...securitySettings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les données utilisateur
      const [tasks, habits, focusSessions, journalEntries, goals] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user?.id),
        supabase.from('habits').select('*').eq('user_id', user?.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user?.id),
        supabase.from('journal_entries').select('*').eq('user_id', user?.id),
        supabase.from('goals').select('*').eq('user_id', user?.id),
      ]);

      const userData = {
        exportDate: new Date().toISOString(),
        user: { id: user?.id, email: user?.email },
        tasks: tasks.data || [],
        habits: habits.data || [],
        focusSessions: focusSessions.data || [],
        journalEntries: journalEntries.data || [],
        goals: goals.data || []
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deepflow-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Vos données ont été exportées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter vos données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      return;
    }

    setLoading(true);
    try {
      // D'abord, supprimer toutes les données utilisateur
      await Promise.all([
        supabase.from('tasks').delete().eq('user_id', user?.id),
        supabase.from('habits').delete().eq('user_id', user?.id),
        supabase.from('focus_sessions').delete().eq('user_id', user?.id),
        supabase.from('journal_entries').delete().eq('user_id', user?.id),
        supabase.from('goals').delete().eq('user_id', user?.id),
        supabase.from('user_settings').delete().eq('id', user?.id),
        supabase.from('user_profiles').delete().eq('id', user?.id),
      ]);

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés.",
      });

      await signOut();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et paramètres de sécurité
        </p>
      </motion.div>

      <div className="grid gap-6">
        {/* Profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil
              </CardTitle>
              <CardDescription>
                Informations personnelles et profil public
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Nom d'affichage</Label>
                  <Input
                    id="displayName"
                    value={profileSettings.displayName}
                    onChange={(e) => setProfileSettings({...profileSettings, displayName: e.target.value})}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={profileSettings.bio}
                  onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                  placeholder="Parlez-nous de vous..."
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Préférences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Préférences
              </CardTitle>
              <CardDescription>
                Personnalisez votre expérience utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Thème</Label>
                    <Select 
                      value={settings.darkMode} 
                      onValueChange={(value) => setSettings({...settings, darkMode: value})}
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
                            <Monitor className="h-4 w-4" />
                            Système
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Langue</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => setSettings({...settings, language: value})}
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
                    <Label htmlFor="clockFormat">Format d'heure</Label>
                    <Select 
                      value={settings.clockFormat} 
                      onValueChange={(value) => setSettings({...settings, clockFormat: value})}
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sons activés</Label>
                      <p className="text-sm text-muted-foreground">
                        Sons de notification et d'interface
                      </p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => setSettings({...settings, soundEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mode focus</Label>
                      <p className="text-sm text-muted-foreground">
                        Interface minimaliste pendant les sessions
                      </p>
                    </div>
                    <Switch
                      checked={settings.focusMode}
                      onCheckedChange={(checked) => setSettings({...settings, focusMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sauvegarde automatique</Label>
                      <p className="text-sm text-muted-foreground">
                        Sauvegarde périodique de vos données
                      </p>
                    </div>
                    <Switch
                      checked={settings.dataBackup}
                      onCheckedChange={(checked) => setSettings({...settings, dataBackup: checked})}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? "Sauvegarde..." : "Sauvegarder les préférences"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications push</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications dans le navigateur
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications email</Label>
                  <p className="text-sm text-muted-foreground">
                    Résumés hebdomadaires et rappels
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sécurité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
              <CardDescription>
                Paramètres de sécurité et mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Changer le mot de passe
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings({...securitySettings, newPassword: e.target.value})}
                        placeholder="Minimum 8 caractères"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={securitySettings.confirmPassword}
                      onChange={(e) => setSecuritySettings({...securitySettings, confirmPassword: e.target.value})}
                      placeholder="Retapez le mot de passe"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={loading || !securitySettings.newPassword || !securitySettings.confirmPassword}
                >
                  {loading ? "Modification..." : "Changer le mot de passe"}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Sécurité renforcée avec un code de vérification
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Données et confidentialité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Données et confidentialité
              </CardTitle>
              <CardDescription>
                Gérez vos données personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleDataExport}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {loading ? "Export..." : "Exporter mes données"}
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {loading ? "Suppression..." : "Supprimer mon compte"}
                </Button>
              </div>
              
              <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Zone dangereuse</p>
                  <p className="text-sm text-muted-foreground">
                    La suppression du compte est définitive et supprimera toutes vos données.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
