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
import { Zap, Eye, EyeOff, Loader2, Target, Shield, Sparkles } from "lucide-react";
import deepflowLogo from "@/assets/deepflow-logo.png";
import InteractiveBackground from "@/components/layout/InteractiveBackground";

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

  // Anti-bot: honeypot + timing
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
      const { error } = await signUp(values.email, values.password);
      if (error) {
        toast({ variant: "destructive", title: "Erreur", description: error.message });
        setCooldownUntil(Date.now() + 30000);
        return;
      }
      toast({ title: "Inscription réussie !", description: "Vous pouvez maintenant vous connecter." });
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
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-black/40 flex items-center justify-center mb-4 border border-white/10 shadow-2xl backdrop-blur-3xl z-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
                <span className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40 relative z-10">DF</span>
              </div>
            </motion.div>
            <motion.h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>DeepFlow</motion.h1>
            <motion.p className="text-white/40 mt-3 text-base font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>Rejoignez l'élite productive</motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="bg-black/60 backdrop-blur-3xl border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">Créer un compte</CardTitle>
                <CardDescription className="text-white/40 text-sm">Prêt à transformer votre chaos en clarté ?</CardDescription>
              </CardHeader>
              <CardContent>
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
