import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2, Sparkles, Shield, Target } from "lucide-react";

const formSchema = z.object({
  email: z.string()
    .email({
      message: "Veuillez entrer une adresse e-mail valide.",
    })
    .max(255, {
      message: "L'adresse e-mail est trop longue.",
    }),
  password: z.string()
    .min(8, {
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    })
    .max(100, {
      message: "Le mot de passe est trop long.",
    })
    .regex(/[A-Z]/, {
      message: "Le mot de passe doit contenir au moins une majuscule.",
    })
    .regex(/[a-z]/, {
      message: "Le mot de passe doit contenir au moins une minuscule.",
    })
    .regex(/[0-9]/, {
      message: "Le mot de passe doit contenir au moins un chiffre.",
    }),
  displayName: z.string()
    .min(2, {
      message: "Le nom d'utilisateur doit contenir au moins 2 caractères.",
    })
    .max(50, {
      message: "Le nom d'utilisateur est trop long.",
    })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, {
      message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, espaces, tirets et underscores.",
    }),
});

export default function Register() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { error } = await signUp(values.email, values.password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur lors de l'inscription",
          description: error.message,
        });
        return;
      }
      
      toast({
        title: "Inscription réussie !",
        description: "Vous pouvez maintenant vous connecter.",
      });
      
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur lors de l'inscription",
        description: error?.message || "Une erreur s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-success/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-md p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-success rotate-6 glow-effect-primary" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-success flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold gradient-text font-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              DeepFlow
            </motion.h1>
            <motion.p 
              className="text-muted-foreground mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Rejoignez la communauté productive
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="glass-morphism border-border/50 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
                <CardDescription>
                  Commencez votre voyage vers la productivité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Nom d'utilisateur</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Doe" 
                              {...field} 
                              disabled={isLoading}
                              className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="nom@exemple.com" 
                              {...field} 
                              autoComplete="email"
                              disabled={isLoading}
                              className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••" 
                                {...field} 
                                autoComplete="new-password"
                                disabled={isLoading}
                                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Min. 8 caractères avec majuscule, minuscule et chiffre
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-primary to-success hover:opacity-90 transition-opacity glow-effect text-primary-foreground font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Inscription...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Créer mon compte
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4 pt-2">
                <div className="text-sm text-muted-foreground">
                  Vous avez déjà un compte ?{" "}
                  <Link to="/login" className="text-primary hover:text-primary-glow transition-colors font-medium">
                    Se connecter
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Features hint */}
          <motion.div 
            className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-primary" />
              <span>Objectifs</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-success" />
              <span>Habitudes</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-warning" />
              <span>Focus</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
