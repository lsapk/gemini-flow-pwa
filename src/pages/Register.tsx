
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MailIcon, LockIcon, UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password, name);
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
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
            Commencez votre parcours de productivité et développement personnel
          </p>
        </div>

        <Card className="glass-card border-0 overflow-hidden animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl"></div>
          <CardHeader className="space-y-1 relative z-10">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              Entrez vos informations pour créer votre compte DeepFlow
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister} className="relative z-10">
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-muted-foreground">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <Input
                    id="name"
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
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
                <Label htmlFor="password">Mot de passe</Label>
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
                    minLength={8}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Minimum 8 caractères
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  J'accepte les{" "}
                  <Link to="/" className="text-primary hover:underline">
                    conditions d'utilisation
                  </Link>
                  {" "}et la{" "}
                  <Link to="/" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                className="w-full relative group" 
                type="submit" 
                disabled={isLoading || !agreedToTerms}
              >
                <span className={isLoading ? "opacity-0" : "group-hover:scale-105 transition-transform"}>
                  S'inscrire
                </span>
                {isLoading && (
                  <Loader2 className="absolute animate-spin h-5 w-5" />
                )}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Déjà inscrit?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </CardFooter>
          </form>
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          En vous inscrivant, vous acceptez que DeepFlow utilise vos données conformément à notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
};

export default Register;
