import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Trash2, 
  Download,
  Upload,
  Eye,
  EyeOff,
  Key,
  Moon,
  Sun,
  Globe,
  ArrowLeft,
  Crown
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.user_metadata?.full_name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleAdminAccess = async () => {
    if (adminCode === 'Admin69') {
      try {
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: user?.id, role: 'admin' });

        if (error) {
          console.error('Error adding admin role:', error);
        }

        setShowAdminPanel(true);
        toast({
          title: "Accès administrateur accordé",
          description: "Vous avez maintenant les privilèges administrateur.",
        });
      } catch (error: any) {
        console.error('Error in admin access:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'attribution du rôle admin.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Code incorrect",
        description: "Le code administrateur est incorrect.",
        variant: "destructive",
      });
    }
    setAdminCode('');
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.displayName }
      });

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      const userData = {
        profile: user?.user_metadata,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deepflow-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
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

  const handleAccountDeletion = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      toast({
        title: "Fonctionnalité en développement",
        description: "La suppression de compte sera bientôt disponible.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Paramètres
            {(isAdmin || showAdminPanel) && <Crown className="h-5 w-5 text-yellow-500" />}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de sécurité
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {!isAdmin && !showAdminPanel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Accès Administrateur
              </CardTitle>
              <CardDescription>
                Entrez le code administrateur pour accéder aux fonctionnalités avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Code administrateur"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()}
                />
                <Button onClick={handleAdminAccess}>
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(isAdmin || showAdminPanel) && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Crown className="h-5 w-5" />
                Panneau Administrateur
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Vous avez accès à toutes les fonctionnalités administrateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                Administrateur Actif
              </Badge>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                Toutes les données et fonctionnalités de l'application sont accessibles.
              </p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil utilisateur
            </CardTitle>
            <CardDescription>
              Modifiez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié pour des raisons de sécurité
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="Votre nom"
              />
            </div>
            
            <Button onClick={handleProfileUpdate} disabled={loading}>
              Sauvegarder les modifications
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Gérez vos paramètres de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Changer le mot de passe</h4>
              
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
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
              
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
              
              <Button onClick={handlePasswordChange} disabled={loading}>
                <Key className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Authentification à deux facteurs</Label>
                <p className="text-sm text-muted-foreground">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
              </div>
              <div className="flex items-center gap-2">
                {twoFactorEnabled && <Badge variant="secondary">Activé</Badge>}
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configurez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications sur vos objectifs et habitudes
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Synchronisation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Synchroniser automatiquement vos données
                </p>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Thème sombre</Label>
                <p className="text-sm text-muted-foreground">
                  Basculer entre le thème clair et sombre
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Gestion des données
            </CardTitle>
            <CardDescription>
              Exportez ou supprimez vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleDataExport} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Exporter mes données
              </Button>
              
              <Button variant="outline" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Importer des données
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-destructive">Zone de danger</h4>
              <p className="text-sm text-muted-foreground">
                La suppression de votre compte est irréversible.
              </p>
              <Button variant="destructive" onClick={handleAccountDeletion}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer mon compte
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version de l'application</span>
              <span>2.1.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dernière synchronisation</span>
              <span>Il y a 2 minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compte créé le</span>
              <span>{new Date(user?.created_at || '').toLocaleDateString('fr-FR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
