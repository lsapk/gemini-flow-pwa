import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

import { Brain } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    // Recovery session detected — no action needed, Supabase handles the token
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (password.length < 8) { toast({ title: "Mot de passe trop court", description: "Min. 8 caractères.", variant: "destructive" }); setIsLoading(false); return; }
      if (password !== confirmPassword) { toast({ title: "Mots de passe différents", variant: "destructive" }); setIsLoading(false); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
      else { setIsSuccess(true); toast({ title: "Mot de passe mis à jour" }); setTimeout(() => navigate('/login'), 3000); }
    } catch (error) { toast({ title: "Erreur", description: "Une erreur inattendue.", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-5 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <motion.div className="flex justify-center mb-5" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: "spring" }}>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <motion.h1 className="text-3xl font-bold text-white font-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>DeepFlow</motion.h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">{isSuccess ? "Mot de passe réinitialisé !" : "Nouveau mot de passe"}</CardTitle>
                <CardDescription className="text-sky-200/50 text-sm">{isSuccess ? "Redirection vers la connexion..." : "Créez un nouveau mot de passe sécurisé"}</CardDescription>
              </CardHeader>
              <CardContent>
                {isSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
                    <p className="text-white/60">Votre mot de passe a été mis à jour.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-sky-100/80">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 pr-10 text-base" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-sky-100/80">Confirmer</Label>
                      <div className="relative">
                        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 pr-10 text-base" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/40 hover:text-white/70" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      </div>
                    </div>
                    {password.length > 0 && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${password.length >= i * 3 ? password.length >= 12 ? 'bg-emerald-400' : password.length >= 8 ? 'bg-amber-400' : 'bg-red-400' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    )}
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium shadow-lg shadow-sky-500/20 text-base" disabled={isLoading}>
                      {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</>) : (<><Lock className="mr-2 h-4 w-4" />Réinitialiser</>)}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
