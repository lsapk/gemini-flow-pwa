
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailIcon, LockIcon, UserIcon } from "../components/icons/DeepFlowIcons";
import { useToast } from "@/components/ui/use-toast";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // This is a temporary registration function until we integrate Supabase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (name && email && password) {
        // Set authentication state
        localStorage.setItem("isAuthenticated", "true");
        toast({
          title: "Compte créé avec succès",
          description: "Bienvenue sur DeepFlow !",
        });
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: "Veuillez remplir tous les champs.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: "Une erreur s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Link to="/" className="flex items-center justify-center mb-8 space-x-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700"></div>
            <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-900"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
          </div>
          <span className="text-xl font-bold font-heading bg-gradient-to-br from-deepflow-400 to-deepflow-700 text-transparent bg-clip-text">
            DeepFlow
          </span>
        </Link>

        <Card className="glass-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              Créez votre compte DeepFlow pour commencer votre parcours
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-muted-foreground">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <Input
                    id="name"
                    placeholder="Votre nom"
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
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer un compte"}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
