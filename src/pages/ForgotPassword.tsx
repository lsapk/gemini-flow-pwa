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
import deepflowLogo from "@/assets/deepflow-logo.png";

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
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        setIsEmailSent(true);
        toast({ title: "Email envoyé", description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe." });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/images/auth-bg.jpg')` }} />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <motion.div className="flex justify-center mb-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="relative">
                <img src={deepflowLogo} alt="DeepFlow" className="h-20 w-20 rounded-2xl object-contain bg-white/90 dark:bg-white/10 dark:invert p-2 shadow-xl ring-2 ring-white/20" />
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
              </div>
            </motion.div>
            <motion.h1 className="text-3xl font-bold text-white font-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>DeepFlow</motion.h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl font-bold">{isEmailSent ? "Email envoyé !" : "Mot de passe oublié"}</CardTitle>
                <CardDescription>{isEmailSent ? "Vérifiez votre boîte de réception" : "Entrez votre email pour réinitialiser votre mot de passe"}</CardDescription>
              </CardHeader>
              <CardContent>
                {isEmailSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-success" /></div>
                    <p className="text-muted-foreground mb-4">Un email a été envoyé à <strong className="text-foreground">{email}</strong></p>
                    <p className="text-sm text-muted-foreground">Cliquez sur le lien dans l'email pour créer un nouveau mot de passe. Vérifiez aussi vos spams si vous ne le trouvez pas.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required disabled={isLoading} className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors" />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity glow-effect text-primary-foreground font-medium" disabled={isLoading}>
                      {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours...</>) : (<><Mail className="mr-2 h-4 w-4" />Envoyer le lien</>)}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Retour à la connexion</Link>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
