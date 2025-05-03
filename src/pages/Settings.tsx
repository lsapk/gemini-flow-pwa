
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { SettingsIcon, LogOutIcon, UserIcon, BellIcon, MoonIcon, SunIcon, MonitorIcon, MailIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { user, signOut, isAuthenticated } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setDisplayName(user.user_metadata?.display_name || user.profile?.display_name || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("user_profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès."
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    
    // For now, just simulate sending an email
    setTimeout(() => {
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé à l'équipe DeepFlow."
      });
      setContactSubject("");
      setContactMessage("");
      setContactLoading(false);
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Veuillez vous connecter pour accéder à vos paramètres.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
          </CardFooter>
        </Card>
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
          Personnalisez votre expérience DeepFlow.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="account"><UserIcon className="h-4 w-4 mr-2" /> Compte</TabsTrigger>
          <TabsTrigger value="appearance"><SunIcon className="h-4 w-4 mr-2" /> Apparence</TabsTrigger>
          <TabsTrigger value="notifications"><BellIcon className="h-4 w-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="contact"><MailIcon className="h-4 w-4 mr-2" /> Contact</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="text-2xl">{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 text-center md:text-left">
                  <h3 className="font-medium text-lg">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Changer la photo
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom d'affichage</Label>
                  <Input 
                    id="name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Changer de mot de passe</Button>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer les changements"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Gérez votre forfait DeepFlow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Gratuit</h3>
                    <p className="text-sm text-muted-foreground">Votre forfait actuel</p>
                  </div>
                  <Button variant="outline">Mettre à niveau</Button>
                </div>
              </div>

              <div className="grid gap-4 mt-6">
                <div className="grid gap-2">
                  <h3 className="font-medium">Forfaits disponibles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle>Premium</CardTitle>
                        <CardDescription>€9.99/mois</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc ml-5 space-y-2 text-sm">
                          <li>Analyses avancées</li>
                          <li>Assistant IA illimité</li>
                          <li>Stockage illimité</li>
                          <li>Sauvegarde automatique</li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full">S'abonner</Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>€19.99/mois</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc ml-5 space-y-2 text-sm">
                          <li>Toutes les fonctionnalités Premium</li>
                          <li>Support prioritaire</li>
                          <li>Outils d'équipe</li>
                          <li>API personnalisée</li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" variant="outline">S'abonner</Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compte</CardTitle>
              <CardDescription>
                Options avancées de votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Exporter mes données</h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez toutes vos données en format JSON.
                  </p>
                </div>
                <Button variant="outline">Exporter</Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-destructive">Zone de danger</h3>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <h4 className="font-medium">Déconnexion</h4>
                    <p className="text-sm text-muted-foreground">
                      Se déconnecter de l'application sur cet appareil.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOutIcon className="h-4 w-4 mr-2" /> Déconnexion
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <h4 className="font-medium">Supprimer mon compte</h4>
                    <p className="text-sm text-muted-foreground">
                      Supprimer définitivement votre compte et toutes vos données.
                    </p>
                  </div>
                  <Button variant="destructive">Supprimer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thème</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de DeepFlow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center gap-2 h-24"
                  onClick={() => setTheme("light")}
                >
                  <SunIcon className="h-5 w-5" />
                  <span>Clair</span>
                </Button>
                
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center gap-2 h-24"
                  onClick={() => setTheme("dark")}
                >
                  <MoonIcon className="h-5 w-5" />
                  <span>Sombre</span>
                </Button>
                
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center gap-2 h-24"
                  onClick={() => setTheme("system")}
                >
                  <MonitorIcon className="h-5 w-5" />
                  <span>Système</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configurez comment et quand vous recevez des notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifications push</h3>
                  <p className="text-sm text-muted-foreground">
                    Activez les notifications pour rester informé.
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reminder-time">Heure de rappel quotidien</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Nous vous enverrons un rappel quotidien à cette heure.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Enregistrer les préférences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contactez-nous</CardTitle>
              <CardDescription>
                Envoyez un message à l'équipe DeepFlow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact-subject">Sujet</Label>
                  <Input
                    id="contact-subject"
                    placeholder="Sujet de votre message"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Comment pouvons-nous vous aider ?"
                    className="min-h-[150px]"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-4">
                  <p className="text-sm">
                    Vous pouvez également nous contacter directement à <a href="mailto:DeepFlow.ia@gmail.com" className="text-primary hover:underline">DeepFlow.ia@gmail.com</a>
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={contactLoading}>
                  {contactLoading ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
