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
import { Zap, Eye, EyeOff, Loader2, Target, Shield } from "lucide-react";
import deepflowLogo from "@/assets/deepflow-logo.png";

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-indigo-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-5 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <motion.div className="flex justify-center mb-5" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}>
              <img 
                src={deepflowLogo} 
                alt="DeepFlow Logo" 
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-2xl rounded-2xl"
              />
            </motion.div>
            <motion.h1 className="text-3xl sm:text-4xl font-bold text-white font-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>DeepFlow</motion.h1>
            <motion.p className="text-sky-200/60 mt-2 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>Rejoignez la communauté productive</motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">Créer un compte</CardTitle>
                <CardDescription className="text-sky-200/50 text-sm">Commencez votre voyage vers la productivité</CardDescription>
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
                        <FormLabel className="text-sm font-medium text-sky-100/80">Nom d'utilisateur</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 text-base" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-sky-100/80">Email</FormLabel>
                        <FormControl><Input placeholder="nom@exemple.com" {...field} autoComplete="email" disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 text-base" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-sky-100/80">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} autoComplete="new-password" disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 pr-10 text-base" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-white/30">Min. 8 caractères avec majuscule, minuscule et chiffre</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium shadow-lg shadow-sky-500/20 text-base" disabled={isLoading || isCoolingDown}>
                      {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inscription...</>) : isCoolingDown ? "Veuillez patienter..." : (<><Zap className="mr-2 h-4 w-4" />Créer mon compte</>)}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4 pt-2">
                <div className="text-sm text-white/40">Vous avez déjà un compte ?{" "}<Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">Se connecter</Link></div>
                <div className="text-xs text-white/30 text-center">En vous inscrivant, vous acceptez nos conditions d'utilisation.</div>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div className="mt-8 flex justify-center gap-6 text-xs text-white/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <div className="flex items-center gap-1"><Target className="w-3 h-3 text-sky-400" /><span>Objectifs</span></div>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /><span>Habitudes</span></div>
            <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /><span>Focus</span></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
