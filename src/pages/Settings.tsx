
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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getUserSettings, updateUserSettings, getUserSubscription, getUserRoles, isUserAdmin } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createCheckoutSession, createCustomerPortal } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { UserSettings, SubscriptionInfo, UserRole } from "@/types/models";

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Charger les paramètres utilisateur
        const { data: settingsData } = await getUserSettings();
        if (settingsData) {
          setSettings(settingsData as UserSettings);
          // Définir le thème dans le provider de thème en fonction des paramètres utilisateur
          if (settingsData.theme && (settingsData.theme === 'light' || settingsData.theme === 'dark' || settingsData.theme === 'system')) {
            setTheme(settingsData.theme as "light" | "dark" | "system");
          }
        }
        
        // Charger les informations d'abonnement
        const { data: subscriptionData } = await getUserSubscription();
        setSubscription(subscriptionData as SubscriptionInfo);
        
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
      const { data } = await updateUserSettings(settings);
      
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
