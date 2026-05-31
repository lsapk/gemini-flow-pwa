import React from "react";
import { useState, useEffect, useCallback } from "react";
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
import InteractiveBackground from "@/components/layout/InteractiveBackground";
import deepflowLogo from "@/assets/deepflow-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();


  const [failCount, setFailCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownDisplay, setCooldownDisplay] = useState(0);

  const isCoolingDown = Date.now() < cooldownUntil;


  useEffect(() => {
    if (!isCoolingDown) { setCooldownDisplay(0); return; }
    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) { setCooldownDisplay(0); setCooldownUntil(0); }
      else setCooldownDisplay(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil, isCoolingDown]);

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
    if (isCoolingDown) return;
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
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);


        if (newFailCount >= 3) {
          const delays = [10, 30, 60];
          const delayIndex = Math.min(newFailCount - 3, delays.length - 1);
          const cooldownMs = delays[delayIndex] * 1000;
          setCooldownUntil(Date.now() + cooldownMs);
        }

        if (error.message.includes("Invalid login credentials")) {
          toast({ title: "Erreur de connexion", description: "Email ou mot de passe incorrect.", variant: "destructive" });
        } else if (error.message.includes("Email not confirmed")) {
          toast({ title: "Email non confirmé", description: "Veuillez confirmer votre email avant de vous connecter.", variant: "destructive" });
        } else {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      } else {
        setFailCount(0);
        setCooldownUntil(0);
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505]">
      <InteractiveBackground />

      <div className="relative z-10 w-full max-w-md px-5 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-10">
            <motion.div className="flex justify-center mb-6" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white flex items-center justify-center mb-4 shadow-2xl z-10 relative overflow-hidden">
                <img src={deepflowLogo} alt="DeepFlow Logo" className="h-16 w-16 sm:h-20 sm:h-20 object-contain" />
              </div>
            </motion.div>
            <motion.h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>DeepFlow</motion.h1>
            <motion.p className="text-white/40 mt-3 text-base font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>Productivité augmentée par l'IA</motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="bg-black/60 backdrop-blur-3xl border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">Connexion</CardTitle>
                <CardDescription className="text-white/40 text-sm">Accédez à votre espace personnel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    variant="outline"
                    className="h-12 bg-white/5 border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all font-semibold"
                    onClick={() => toast({ title: "Bientôt disponible", description: "La connexion Google sera activée prochainement." })}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuer avec Google
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                    <span className="bg-[#0c0c0c] px-4 text-white/20">Ou avec email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/60 ml-1">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required disabled={isLoading || isCoolingDown} className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/10 transition-all text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white/60 ml-1">Mot de passe</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading || isCoolingDown} className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/10 transition-all pr-10 text-base" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-0 h-full hover:bg-transparent text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} disabled={isLoading} className="border-white/20 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                    <Label htmlFor="remember" className="text-sm text-white/50 leading-none cursor-pointer">Se souvenir de moi</Label>
                  </div>
                  {cooldownDisplay > 0 && (
                    <p className="text-center text-sm text-red-400/80">Trop de tentatives. Réessayez dans {cooldownDisplay}s</p>
                  )}
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold shadow-lg shadow-primary/20 text-base mt-4" disabled={isLoading || isCoolingDown}>
                    {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Connexion...</>) : isCoolingDown ? `Patientez ${cooldownDisplay}s` : (<><Shield className="mr-2 h-5 w-5" />Se connecter</>)}
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

          <motion.div className="mt-8 flex justify-center gap-6 text-xs text-white/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <div className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-sky-400" /><span>IA intégrée</span></div>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /><span>Sécurisé</span></div>
            <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /><span>Rapide</span></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
