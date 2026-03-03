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
import penguinMascot from "@/assets/penguin-mascot.png";

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-5 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <motion.div className="flex justify-center mb-5" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: "spring" }}>
              <motion.img src={penguinMascot} alt="DeepFlow Penguin" className="h-24 w-24 object-contain drop-shadow-2xl"
                animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            </motion.div>
            <motion.h1 className="text-3xl font-bold text-white font-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>DeepFlow</motion.h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">{isEmailSent ? "Email envoyé !" : "Mot de passe oublié"}</CardTitle>
                <CardDescription className="text-sky-200/50 text-sm">{isEmailSent ? "Vérifiez votre boîte de réception" : "Entrez votre email pour réinitialiser"}</CardDescription>
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
                      <Label htmlFor="email" className="text-sm font-medium text-sky-100/80">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required disabled={isLoading} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-sky-400/50 text-base" />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium shadow-lg shadow-sky-500/20 text-base" disabled={isLoading}>
                      {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</>) : (<><Mail className="mr-2 h-4 w-4" />Envoyer le lien</>)}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Link to="/login" className="text-sm text-white/40 hover:text-sky-300 transition-colors flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Retour à la connexion</Link>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
