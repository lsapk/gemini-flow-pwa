import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings as SettingsIcon, User, Bell, Moon, Sun, Shield, Palette, Clock, Globe, Volume2, Key } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import MobileHeader from "@/components/layout/MobileHeader";

export default function Settings() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [clockFormat, setClockFormat] = useState("24h");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

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
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || '');
        setEmail(profile.email || user.email || '');
      }

      if (settings) {
        setNotifications(settings.notifications_enabled ?? true);
        setSoundEnabled(settings.sound_enabled ?? true);
        setFocusMode(settings.focus_mode ?? false);
        setLanguage(settings.language || 'fr');
        setClockFormat(settings.clock_format || '24h');
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
      setIsAdmin(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          email: email
        });

      if (error) throw error;

      toast.success('Profil mis à jour avec succès!');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          id: user.id,
          [key]: value 
        });

      if (error) throw error;

      toast.success('Paramètre mis à jour!');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  const handleAdminCode = async () => {
    if (adminCode === "DEEPFLOW_ADMIN_2024") {
      try {
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user?.id,
            role: 'admin'
          });

        if (error) {
          throw error;
        }

        setIsAdmin(true);
        setShowAdminDialog(false);
        setAdminCode("");
        toast.success('Vous êtes maintenant administrateur!');
        checkAdminStatus();
      } catch (error: any) {
        toast.error('Erreur lors de l\'activation admin: ' + error.message);
      }
    } else {
      toast.error('Code administrateur incorrect');
    }
  };

  const sidebarContent = <Sidebar onItemClick={() => setSidebarOpen(false)} />;

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
          <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <DrawerContent>
              {sidebarContent}
            </DrawerContent>
          </Drawer>
          <div className="pt-14">
            <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
              {/* Contenu identique mais dans un wrapper mobile */}
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
                    Notifications & Sons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications push</Label>
                      <div className="text-sm text-muted-foreground">
                        Recevoir des notifications pour les rappels et les mises à jour
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={(checked) => {
                        setNotifications(checked);
                        saveSettings('notifications_enabled', checked);
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Sons activés
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Sons pour les notifications et interactions
                      </div>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={(checked) => {
                        setSoundEnabled(checked);
                        saveSettings('sound_enabled', checked);
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mode focus</Label>
                      <div className="text-sm text-muted-foreground">
                        Réduire les distractions pendant les sessions
                      </div>
                    </div>
                    <Switch
                      checked={focusMode}
                      onCheckedChange={(checked) => {
                        setFocusMode(checked);
                        saveSettings('focus_mode', checked);
                      }}
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
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        Thème
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Choisir entre le mode clair, sombre ou automatique
                      </div>
                    </div>
                    <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="system">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Localisation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Langue</Label>
                      <div className="text-sm text-muted-foreground">
                        Langue de l'interface utilisateur
                      </div>
                    </div>
                    <Select value={language} onValueChange={(value) => {
                      setLanguage(value);
                      saveSettings('language', value);
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Format d'heure
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Format d'affichage de l'heure
                      </div>
                    </div>
                    <Select value={clockFormat} onValueChange={(value) => {
                      setClockFormat(value);
                      saveSettings('clock_format', value);
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h</SelectItem>
                        <SelectItem value="12h">12h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Code Administrateur */}
              {!isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Accès Administrateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Vous avez un code administrateur ? Activez vos privilèges d'admin.
                      </p>
                      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Shield className="h-4 w-4 mr-2" />
                            Activer le mode Admin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Code Administrateur</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="adminCode">Code d'accès</Label>
                              <Input
                                id="adminCode"
                                type="password"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                placeholder="Entrez le code administrateur"
                              />
                            </div>
                            <Button onClick={handleAdminCode} className="w-full">
                              Valider
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paramètres admin */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Gérer les utilisateurs
                          </Button>
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Statistiques système
                          </Button>
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Paramètres globaux
                          </Button>
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Logs système
                          </Button>
                        </div>
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
                    <p><strong>Nom affiché:</strong> {displayName || 'Non défini'}</p>
                    <p><strong>Email:</strong> {email || user?.email || 'Non disponible'}</p>
                    <p><strong>ID utilisateur:</strong> {user?.id}</p>
                    <p><strong>Compte créé:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
                    <p><strong>Statut:</strong> {isAdmin ? 'Administrateur' : 'Utilisateur'}</p>
                    <p><strong>Langue:</strong> {language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'Español'}</p>
                    <p><strong>Thème:</strong> {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Automatique'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-screen w-full">
          {sidebarContent}
          <div className="flex-1">
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
                    Notifications & Sons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications push</Label>
                      <div className="text-sm text-muted-foreground">
                        Recevoir des notifications pour les rappels et les mises à jour
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={(checked) => {
                        setNotifications(checked);
                        saveSettings('notifications_enabled', checked);
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Sons activés
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Sons pour les notifications et interactions
                      </div>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={(checked) => {
                        setSoundEnabled(checked);
                        saveSettings('sound_enabled', checked);
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mode focus</Label>
                      <div className="text-sm text-muted-foreground">
                        Réduire les distractions pendant les sessions
                      </div>
                    </div>
                    <Switch
                      checked={focusMode}
                      onCheckedChange={(checked) => {
                        setFocusMode(checked);
                        saveSettings('focus_mode', checked);
                      }}
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
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        Thème
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Choisir entre le mode clair, sombre ou automatique
                      </div>
                    </div>
                    <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="system">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Localisation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Langue</Label>
                      <div className="text-sm text-muted-foreground">
                        Langue de l'interface utilisateur
                      </div>
                    </div>
                    <Select value={language} onValueChange={(value) => {
                      setLanguage(value);
                      saveSettings('language', value);
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Format d'heure
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Format d'affichage de l'heure
                      </div>
                    </div>
                    <Select value={clockFormat} onValueChange={(value) => {
                      setClockFormat(value);
                      saveSettings('clock_format', value);
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h</SelectItem>
                        <SelectItem value="12h">12h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Code Administrateur */}
              {!isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Accès Administrateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Vous avez un code administrateur ? Activez vos privilèges d'admin.
                      </p>
                      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Shield className="h-4 w-4 mr-2" />
                            Activer le mode Admin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Code Administrateur</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="adminCode">Code d'accès</Label>
                              <Input
                                id="adminCode"
                                type="password"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                placeholder="Entrez le code administrateur"
                              />
                            </div>
                            <Button onClick={handleAdminCode} className="w-full">
                              Valider
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paramètres admin */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Gérer les utilisateurs
                          </Button>
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Statistiques système
                          </Button>
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Paramètres globaux
                          </Button>
                          <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/20">
                            Logs système
                          </Button>
                        </div>
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
                    <p><strong>Nom affiché:</strong> {displayName || 'Non défini'}</p>
                    <p><strong>Email:</strong> {email || user?.email || 'Non disponible'}</p>
                    <p><strong>ID utilisateur:</strong> {user?.id}</p>
                    <p><strong>Compte créé:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
                    <p><strong>Statut:</strong> {isAdmin ? 'Administrateur' : 'Utilisateur'}</p>
                    <p><strong>Langue:</strong> {language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'Español'}</p>
                    <p><strong>Thème:</strong> {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Automatique'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
