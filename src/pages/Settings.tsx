
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SettingsIcon, UserCircle, BellIcon, Globe, CreditCard, MailIcon } from "lucide-react";
import { getUserSettings, updateUserSettings, sendContactEmail } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    theme: "system",
    language: "fr",
    notificationsEnabled: true,
    soundEnabled: true,
    clockFormat: "24h",
    focusMode: false,
  });
  
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour accéder aux paramètres.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchUserSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await getUserSettings();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setFormState({
            theme: data.theme || "system",
            language: data.language || "fr",
            notificationsEnabled: data.notifications_enabled !== false,
            soundEnabled: data.sound_enabled !== false,
            clockFormat: data.clock_format || "24h",
            focusMode: data.focus_mode || false,
          });
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger vos paramètres.",
          variant: "destructive",
        });
        console.error("Error fetching user settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [user, toast, navigate]);

  const handleSettingChange = async (key: string, value: any) => {
    if (!user) return;
    
    const newFormState = { ...formState, [key]: value };
    setFormState(newFormState);
    
    try {
      const updates = {
        theme: newFormState.theme,
        language: newFormState.language,
        notifications_enabled: newFormState.notificationsEnabled,
        sound_enabled: newFormState.soundEnabled,
        clock_format: newFormState.clockFormat,
        focus_mode: newFormState.focusMode,
      };
      
      const { error } = await updateUserSettings(updates);
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Paramètres mis à jour",
        description: "Vos préférences ont été enregistrées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer vos paramètres.",
        variant: "destructive",
      });
      console.error("Error updating settings:", error);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setContactSubmitting(true);
      const { data, error } = await sendContactEmail(
        contactForm.name,
        contactForm.email,
        contactForm.message
      );
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès.",
      });
      
      setContactForm({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message.",
        variant: "destructive",
      });
      console.error("Error sending contact message:", error);
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et votre compte.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-4 md:grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Personnalisez l'apparence et le comportement de DeepFlow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème</Label>
                  <Select 
                    disabled={loading} 
                    value={formState.theme} 
                    onValueChange={(value) => handleSettingChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select 
                    disabled={loading} 
                    value={formState.language} 
                    onValueChange={(value) => handleSettingChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clockFormat">Format d'horloge</Label>
                  <Select 
                    disabled={loading} 
                    value={formState.clockFormat} 
                    onValueChange={(value) => handleSettingChange("clockFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Format d'horloge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
                      <SelectItem value="24h">24 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="focusMode">Mode Focus</Label>
                    <p className="text-sm text-muted-foreground">
                      Réduire les distractions et les notifications
                    </p>
                  </div>
                  <Switch
                    id="focusMode"
                    disabled={loading}
                    checked={formState.focusMode}
                    onCheckedChange={(checked) => handleSettingChange("focusMode", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Compte</CardTitle>
              <CardDescription>
                Gérez votre profil et vos informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <UserCircle className="h-20 w-20 text-muted-foreground" />
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-medium">{user?.user_metadata?.display_name || user?.email}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nom d'affichage</Label>
                  <Input id="displayName" value={user?.user_metadata?.display_name || ""} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  signOut();
                  navigate("/login");
                }}
              >
                Se déconnecter
              </Button>
              <Button disabled>
                Mettre à jour le profil
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle>Plan d'abonnement</CardTitle>
              <CardDescription>
                Gérez votre abonnement et vos options de facturation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">Plan Gratuit</h3>
                    <p className="text-sm text-muted-foreground">
                      Fonctionnalités de base avec des limitations.
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Actif
                  </span>
                </div>
                <Separator className="my-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Suivi de tâches
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Journal personnel
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Mode Focus
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <span className="mr-2">✗</span> Analyse IA avancée
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <span className="mr-2">✗</span> Assistant IA illimité
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Passer à Premium
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configurez les notifications et les alertes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les notifications dans l'application
                  </p>
                </div>
                <Switch
                  id="notifications"
                  disabled={loading}
                  checked={formState.notificationsEnabled}
                  onCheckedChange={(checked) => handleSettingChange("notificationsEnabled", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Sons</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les sons pour les notifications
                  </p>
                </div>
                <Switch
                  id="sound"
                  disabled={loading || !formState.notificationsEnabled}
                  checked={formState.soundEnabled && formState.notificationsEnabled}
                  onCheckedChange={(checked) => handleSettingChange("soundEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Contactez-nous</CardTitle>
              <CardDescription>
                Envoyez un message au créateur de DeepFlow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input 
                    id="name" 
                    value={contactForm.name} 
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Votre nom" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={contactForm.email} 
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    placeholder="votre@email.com" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    value={contactForm.message} 
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    placeholder="Écrivez votre message ici..." 
                    required 
                    rows={5} 
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={contactSubmitting}>
                  <MailIcon className="mr-2 h-4 w-4" />
                  {contactSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-sm text-muted-foreground">
                Votre message sera envoyé à : DeepFlow.ia@gmail.com
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
