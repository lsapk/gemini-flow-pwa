
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700"></div>
              <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DeepFlow</h1>
          <p className="text-muted-foreground mt-1">Créez votre compte DeepFlow</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Entrez vos informations pour créer un compte
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
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="nom@exemple.com" {...field} autoComplete="email" />
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
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          autoComplete="new-password" 
                        />
                      </FormControl>
                      <FormDescription>
                        Au moins 8 caractères
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Inscription en cours..." : "S'inscrire"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Vous avez déjà un compte?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
