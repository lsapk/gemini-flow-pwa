import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Shield, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import penguinMascot from "@/assets/penguin-mascot.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('deepflow_user_email');
    const shouldRemember = localStorage.getItem('deepflow_remember_me') === 'true';
    if (shouldRemember && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email || !email.includes('@')) {
        toast({ title: "Email invalide", description: "Veuillez entrer une adresse email valide.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (password.length < 8) {
        toast({ title: "Mot de passe trop court", description: "Le mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

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
          toast({ title: "Erreur de connexion", description: "Email ou mot de passe incorrect.", variant: "destructive" });
        } else if (error.message.includes("Email not confirmed")) {
          toast({ title: "Email non confirmé", description: "Veuillez confirmer votre email avant de vous connecter.", variant: "destructive" });
        } else {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Connexion réussie", description: "Bienvenue sur DeepFlow !" });
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-indigo-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Centered penguin mascot only */}
          <div className="text-center mb-8">
            <motion.div 
              className="flex justify-center mb-5"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <motion.img 
                src={penguinMascot} 
                alt="DeepFlow Penguin" 
                className="h-28 w-28 sm:h-32 sm:w-32 object-contain drop-shadow-2xl"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                }}
              />
            </motion.div>
            <motion.h1 
              className="text-3xl sm:text-4xl font-bold text-white font-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              DeepFlow
            </motion.h1>
            <motion.p 
              className="text-sky-200/60 mt-2 text-sm"
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
            <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">Connexion</CardTitle>
                <CardDescription className="text-sky-200/50 text-sm">Accédez à votre espace personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-sky-100/80">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 transition-colors text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-sky-100/80">Mot de passe</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 transition-colors pr-10 text-base" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} disabled={isLoading} className="border-white/20 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                    <Label htmlFor="remember" className="text-sm text-white/50 leading-none cursor-pointer">Se souvenir de moi</Label>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 transition-all text-white font-medium shadow-lg shadow-sky-500/20 text-base" disabled={isLoading}>
                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>) : (<><Shield className="mr-2 h-4 w-4" />Se connecter</>)}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4 pt-2">
                <Link to="/forgot-password" className="text-sm text-white/40 hover:text-sky-300 transition-colors">Mot de passe oublié ?</Link>
                <div className="text-sm text-white/40">
                  Pas encore de compte ?{" "}
                  <Link to="/register" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">S'inscrire gratuitement</Link>
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div 
            className="mt-8 flex justify-center gap-6 text-xs text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-sky-400" /><span>IA intégrée</span></div>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /><span>Sécurisé</span></div>
            <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /><span>Rapide</span></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
