import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2, Target, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import deepflowLogo from "@/assets/deepflow-logo.png";
import InteractiveBackground from "@/components/layout/InteractiveBackground";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }).max(255),
  password: z.string().min(8, { message: "Min. 8 caractères." }).max(100).regex(/[A-Z]/, { message: "Une majuscule requise." }).regex(/[a-z]/, { message: "Une minuscule requise." }).regex(/[0-9]/, { message: "Un chiffre requis." }),
  displayName: z.string().min(2, { message: "Min. 2 caractères." }).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/, { message: "Lettres, chiffres, espaces, tirets uniquement." }),
});

export default function Register() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [pendingGoal] = useState(() => localStorage.getItem("deepflow_pending_goal"));


  const [honeypot, setHoneypot] = useState("");
  const [loadTime] = useState(Date.now());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const isCoolingDown = Date.now() < cooldownUntil;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (honeypot) return;
    if (Date.now() - loadTime < 3000) return;
    if (isCoolingDown) return;

    setIsLoading(true);
    try {
      const { data, error } = await signUp(values.email, values.password);
      if (error) {
        toast({ variant: "destructive", title: "Erreur", description: error.message });
        setCooldownUntil(Date.now() + 30000);
        return;
      }

      // If there's a pending goal and we have a user, try to save it
      if (pendingGoal && data?.user) {
        await supabase.from("goals").insert({
          user_id: data.user.id,
          title: pendingGoal,
          completed: false,
          progress: 0,
        });
        localStorage.removeItem("deepflow_pending_goal");
      }

      localStorage.setItem("deepflow_onboarding_pending", "1");
      toast({ title: "Inscription réussie !", description: "Connectez-vous pour démarrer avec l'Auto-Pilot IA." });
      navigate("/login");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Une erreur s'est produite." });
      setCooldownUntil(Date.now() + 30000);
    } finally { setIsLoading(false); }
  }

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
            <motion.p className="text-white/40 mt-3 text-base font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>Rejoignez l'élite productive</motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="bg-black/60 backdrop-blur-3xl border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden">
              <div className="pt-8 px-8 pb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Étape 2: Configuration</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">66%</span>
                </div>
                <Progress value={66} className="h-1 bg-white/5" />
              </div>

              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">Créer un compte</CardTitle>
                <CardDescription className="text-white/40 text-sm">
                  {pendingGoal ? "Sauvegardez votre objectif et commencez." : "Prêt à transformer votre chaos en clarté ?"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pendingGoal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-primary/60">Objectif capturé</p>
                      <p className="text-sm font-medium text-white truncate max-w-[200px]">{pendingGoal}</p>
                    </div>
                  </motion.div>
                )}

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

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Honeypot field */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
                      <label htmlFor="website">Website</label>
                      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                    </div>

                    <FormField control={form.control} name="displayName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white/60 ml-1">Nom d'utilisateur</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} disabled={isLoading} className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/10 transition-all text-base" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white/60 ml-1">Email</FormLabel>
                        <FormControl><Input placeholder="nom@exemple.com" {...field} autoComplete="email" disabled={isLoading} className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/10 transition-all text-base" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white/60 ml-1">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} autoComplete="new-password" disabled={isLoading} className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/10 transition-all pr-10 text-base" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-0 h-full px-3 py-2 hover:bg-transparent text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold shadow-lg shadow-primary/20 text-base mt-4" disabled={isLoading || isCoolingDown}>
                      {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Inscription...</>) : isCoolingDown ? "Patientez..." : (<><Zap className="mr-2 h-5 w-5" />Démarrer mon accès</>)}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4 pt-2">
                <div className="text-sm text-white/40 font-medium">Vous avez déjà un compte ?{" "}<Link to="/login" className="text-primary hover:text-blue-400 transition-colors font-bold">Se connecter</Link></div>
                <div className="text-[10px] text-white/20 text-center px-4">En vous inscrivant, vous rejoignez une communauté d'élite et acceptez nos conditions de service.</div>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div className="mt-8 flex justify-center gap-6 text-xs text-white/40 font-bold uppercase tracking-widest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" /><span>Objectifs</span></div>
            <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /><span>Sécurité</span></div>
            <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-400" /><span>Focus IA</span></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
