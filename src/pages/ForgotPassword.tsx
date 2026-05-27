import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import InteractiveBackground from "@/components/layout/InteractiveBackground";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!email || !email.includes('@')) {
        toast({ title: "Email invalide", description: "Veuillez entrer une adresse email valide.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
      else { setIsEmailSent(true); toast({ title: "Email envoyé", description: "Vérifiez votre boîte de réception." }); }
    } catch (error) { toast({ title: "Erreur", description: "Une erreur inattendue s'est produite.", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

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
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="bg-black/60 backdrop-blur-3xl border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">{isEmailSent ? "Email envoyé !" : "Mot de passe oublié"}</CardTitle>
                <CardDescription className="text-white/40 text-sm">{isEmailSent ? "Vérifiez votre boîte de réception" : "Entrez votre email pour réinitialiser"}</CardDescription>
              </CardHeader>
              <CardContent>
                {isEmailSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
                    <p className="text-white/60 mb-4">Un email a été envoyé à <strong className="text-white">{email}</strong></p>
                    <p className="text-sm text-white/40">Cliquez sur le lien dans l'email pour créer un nouveau mot de passe.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-white/60 ml-1">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required disabled={isLoading} className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/10 transition-all text-base" />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold shadow-lg shadow-primary/20 text-base mt-4" disabled={isLoading}>
                      {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Envoi...</>) : (<><Mail className="mr-2 h-5 w-5" />Envoyer le lien</>)}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2 font-medium"><ArrowLeft className="w-4 h-4" />Retour à la connexion</Link>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
