
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  SettingsIcon, 
  BellIcon, 
  MoonIcon, 
  ComputerIcon, 
  SunIcon, 
  CreditCard, 
  CheckCircle, 
  CrownIcon, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  KeyIcon,
  UserX,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getUserSettings, updateUserSettings, getUserSubscription, getUserRoles, isUserAdmin } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createCheckoutSession, createCustomerPortal } from "@/services/billing";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [subscription, setSubscription] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  
  // Nouvelles variables d'état
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Charger les paramètres utilisateur
        const { data: settingsData, error: settingsError } = await getUserSettings();
        if (settingsError) throw new Error(settingsError);
        if (settingsData) {
          setSettings(settingsData as UserSettings);
          // Définir le thème dans le provider de thème en fonction des paramètres utilisateur
          if (settingsData.theme && (settingsData.theme === 'light' || settingsData.theme === 'dark' || settingsData.theme === 'system')) {
            setTheme(settingsData.theme as "light" | "dark" | "system");
          }
        }
        
        // Charger les informations d'abonnement
        const { data: subscriptionData } = await getUserSubscription();
        setSubscription(subscriptionData);
        
        // Vérifier si l'utilisateur est administrateur
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
        
        // Charger les rôles de l'utilisateur
        const { data: rolesData } = await getUserRoles();
        setRoles(rolesData || []);
        
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos paramètres.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, toast, setTheme]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const { error } = await updateUserSettings(settings);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour.",
      });
      
      // Mettre à jour le thème dans le provider de thème
      if (settings.theme && (settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'system')) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
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

  const handleCheckout = async (planType: 'basic' | 'premium' | 'ultimate') => {
    try {
      setCheckoutLoading(true);
      
      const { url, error } = await createCheckoutSession(planType);
      
      if (error) {
        throw new Error(error);
      }
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session de paiement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      
      const { url, error } = await createCustomerPortal();
      
      if (error) {
        throw new Error(error);
      }
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur lors de la création du portail client:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au portail client.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  // Nouvelle fonction pour la mise à jour du mot de passe
  const handleUpdatePassword = async () => {
    setPasswordError("");
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Tous les champs sont requis");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      setPasswordLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès",
      });
      
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setPasswordError(error.message || "Échec de la mise à jour du mot de passe");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Nouvelle fonction pour supprimer le compte utilisateur
  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.from('user_settings').delete().eq('id', user?.id);
      if (error) throw error;
      
      // Supprimer les autres données associées à l'utilisateur
      // Note: Pas besoin de supprimer l'entrée auth.users car la suppression du compte 
      // sera gérée par Supabase Auth
      
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '');
      if (authError) throw authError;
      
      await signOut();
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer votre compte",
        variant: "destructive",
      });
    }
  };

  const hasCreatorPlan = roles.some(role => role.role === 'creator');
  const hasActiveSubscription = subscription?.subscribed || false;
  const subscriptionTier = subscription?.subscription_tier || null;
  const isSubscriber = hasActiveSubscription || isAdmin || hasCreatorPlan;

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
      
      {isAdmin && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Compte Administrateur</AlertTitle>
          <AlertDescription>
            Vous êtes connecté en tant qu'administrateur. Vous avez accès à toutes les fonctionnalités premium.
          </AlertDescription>
        </Alert>
      )}
      
      {hasCreatorPlan && !isAdmin && (
        <Alert>
          <CrownIcon className="h-4 w-4" />
          <AlertTitle>Plan Créateur</AlertTitle>
          <AlertDescription>
            Vous bénéficiez du plan Créateur qui vous donne accès à toutes les fonctionnalités premium gratuitement.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
        </TabsList>
        
        {/* Paramètres généraux */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configurez les options principales de l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection de la langue */}
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
              
              {/* Format de l'horloge */}
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
              
              {/* Mode Focus */}
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
        
        {/* Paramètres de notifications */}
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
              
              {/* Sons */}
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
        
        {/* Paramètres d'apparence */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection du thème */}
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

        {/* Paramètres de sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte et vos informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Changer le mot de passe */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <KeyIcon className="h-4 w-4" />
                      Mot de passe
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Modifiez votre mot de passe pour sécuriser votre compte.
                    </p>
                  </div>
                  <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Modifier</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Modifier votre mot de passe</DialogTitle>
                        <DialogDescription>
                          Veuillez entrer votre mot de passe actuel et votre nouveau mot de passe.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {passwordError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{passwordError}</AlertDescription>
                          </Alert>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="old-password">Mot de passe actuel</Label>
                          <div className="relative">
                            <Input
                              id="old-password"
                              type="password"
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-password">Nouveau mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setPasswordOpen(false)}
                          disabled={passwordLoading}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit" 
                          onClick={handleUpdatePassword}
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Mise à jour...
                            </>
                          ) : (
                            "Mettre à jour"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Suppression du compte */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2 text-destructive">
                      <UserX className="h-4 w-4" />
                      Suppression du compte
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Supprimer définitivement votre compte et toutes vos données.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Supprimer le compte</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est permanente et irréversible. Toutes vos données seront définitivement supprimées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Abonnement */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gérer votre abonnement</CardTitle>
              <CardDescription>
                Consultez et gérez votre abonnement DeepFlow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSubscriber ? (
                <div className="space-y-4">
                  <Alert className="bg-primary/10 border-primary/20">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertTitle>
                      {isAdmin 
                        ? "Compte Administrateur" 
                        : hasCreatorPlan 
                          ? "Plan Créateur" 
                          : `Plan ${subscriptionTier || "Premium"} actif`}
                    </AlertTitle>
                    <AlertDescription>
                      {isAdmin 
                        ? "Vous avez accès à toutes les fonctionnalités premium en tant qu'administrateur."
                        : hasCreatorPlan
                          ? "Vous bénéficiez de l'accès à toutes les fonctionnalités premium gratuitement."
                          : "Vous bénéficiez de toutes les fonctionnalités premium sans limitation."}
                    </AlertDescription>
                  </Alert>
                  
                  {hasActiveSubscription && !isAdmin && !hasCreatorPlan && (
                    <Button 
                      onClick={handlePortal} 
                      className="w-full"
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Gérer mon abonnement
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Compte gratuit limité</AlertTitle>
                    <AlertDescription>
                      Vous utilisez actuellement la version gratuite avec des limitations. Passez à un abonnement premium pour débloquer toutes les fonctionnalités.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Plan Basique */}
                    <Card className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          Basique
                          <Badge variant="outline">4,99€/mois</Badge>
                        </CardTitle>
                        <CardDescription>Pour les débutants</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            10 requêtes IA/jour
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Synchronisation hors-ligne
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Rapports de productivité
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          onClick={() => handleCheckout('basic')} 
                          className="w-full"
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            "Choisir ce plan"
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Plan Premium */}
                    <Card className="flex flex-col border-primary relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                        Populaire
                      </div>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          Premium
                          <Badge variant="outline">9,99€/mois</Badge>
                        </CardTitle>
                        <CardDescription>Pour les utilisateurs réguliers</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Requêtes IA illimitées
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Fonctionnalités avancées d'analyse
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Rapports personnalisés
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Synchronisation multi-appareils
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          onClick={() => handleCheckout('premium')} 
                          className="w-full"
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            "Choisir ce plan"
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Plan Ultimate */}
                    <Card className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          Ultimate
                          <Badge variant="outline">19,99€/mois</Badge>
                        </CardTitle>
                        <CardDescription>Pour les professionnels</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Tout du plan Premium
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Modèles IA avancés
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Support prioritaire
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Fonctionnalités en avant-première
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          onClick={() => handleCheckout('ultimate')} 
                          className="w-full"
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            "Choisir ce plan"
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              )}
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
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
