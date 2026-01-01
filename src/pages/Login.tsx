import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Zap, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  // Charger l'email sauvegardé au chargement de la page
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('deepflow_user_email');
    const shouldRemember = localStorage.getItem('deepflow_remember_me') === 'true';
    
    if (shouldRemember && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic client-side validation
      if (!email || !email.includes('@')) {
        toast({
          title: "Email invalide",
          description: "Veuillez entrer une adresse email valide.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        toast({
          title: "Mot de passe trop court",
          description: "Le mot de passe doit contenir au moins 8 caractères.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Stocker la préférence "Se souvenir de moi"
      if (rememberMe) {
        localStorage.setItem('deepflow_remember_me', 'true');
        localStorage.setItem('deepflow_user_email', email);
      } else {
        localStorage.removeItem('deepflow_remember_me');
        localStorage.removeItem('deepflow_user_email');
      }

      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email non confirmé",
            description: "Veuillez confirmer votre email avant de vous connecter.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur DeepFlow !",
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-info/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-md p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-glow rotate-6 glow-effect-primary" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold gradient-text font-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              DeepFlow
            </motion.h1>
            <motion.p 
              className="text-muted-foreground mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Productivité augmentée par l'IA
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="glass-morphism border-border/50 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
                <CardDescription>
                  Accédez à votre espace personnel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      disabled={isLoading}
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                      className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground leading-none cursor-pointer"
                    >
                      Se souvenir de moi sur cet appareil
                    </Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity glow-effect text-primary-foreground font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4 pt-2">
                <div className="text-sm text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <Link to="/register" className="text-primary hover:text-primary-glow transition-colors font-medium">
                    S'inscrire gratuitement
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Features hint */}
          <motion.div 
            className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>IA intégrée</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-success" />
              <span>Sécurisé</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-warning" />
              <span>Rapide</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
