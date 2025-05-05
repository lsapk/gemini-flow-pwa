
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailIcon, LockIcon, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error("Erreur de connexion:", error);
        toast({
          title: "Échec de la connexion",
          description: error.message || "Vérifiez vos identifiants et réessayez.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (data.session) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur DeepFlow!",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Exception lors de la connexion:", error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur s'est produite lors de la connexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <Link to="/" className="flex items-center justify-center mb-4 space-x-2">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700 animate-pulse"></div>
              <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-900"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
            </div>
          </Link>
          <span className="text-3xl font-bold font-heading bg-gradient-to-br from-deepflow-400 to-deepflow-700 text-transparent bg-clip-text mb-2">
            DeepFlow
          </span>
          <p className="text-muted-foreground text-center max-w-xs">
            Productivité, habitudes, et développement personnel assistés par IA
          </p>
        </div>

        <Card className="glass-card border-0 overflow-hidden animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl"></div>
          <CardHeader className="space-y-1 relative z-10">
            <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin} className="relative z-10">
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-muted-foreground">
                    <MailIcon className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link
                    to="/login"
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-muted-foreground">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button className="w-full relative group" type="submit" disabled={isLoading}>
                <span className={isLoading ? "opacity-0" : "group-hover:scale-105 transition-transform"}>
                  Se connecter
                </span>
                {isLoading && (
                  <Loader2 className="absolute animate-spin h-5 w-5" />
                )}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Pas encore de compte?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  S'inscrire
                </Link>
              </p>
            </CardFooter>
          </form>
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          En vous connectant, vous acceptez nos {" "}
          <Link to="/" className="hover:underline">conditions d'utilisation</Link>
          {" "} et notre {" "}
          <Link to="/" className="hover:underline">politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
