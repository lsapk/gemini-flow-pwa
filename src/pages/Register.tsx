import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/layout/Sidebar";
export default function Register() {
  const { user, signUp } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await signUp(
        String(data.get("email")),
        String(data.get("password")),
        String(data.get("name")),
      );
      if (result.error)
        setError(
          "Le compte n’a pas pu être créé. Vérifiez vos informations ou essayez de vous connecter.",
        );
      else setSent(true);
    } catch {
      setError("Service indisponible. Réessayez dans quelques instants.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-[380px]">
        <Link to="/" className="mb-10 inline-flex">
          <Brand />
        </Link>
        <h1 className="page-title">Un espace à vous.</h1>
        <p className="mb-8 mt-3 text-sm text-muted-foreground">
          Pour vos études, vos projets et votre quotidien.
        </p>
        {!isSupabaseConfigured && (
          <div
            role="status"
            className="mb-6 rounded-xl border bg-card p-4 text-sm"
          >
            Supabase doit être configuré pour créer un compte.{" "}
            <Link to="/preview" className="text-primary underline">
              Voir l’aperçu
            </Link>
          </div>
        )}
        {sent ? (
          <div role="status" className="panel p-6">
            <h2 className="font-semibold">Vérifiez votre boîte mail.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Si votre inscription est acceptée, vous recevrez un lien de
              confirmation. Vous pourrez ensuite vous connecter.
            </p>
            <Button asChild className="mt-5">
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Votre prénom ou pseudonyme</Label>
              <Input
                id="name"
                name="name"
                autoComplete="nickname"
                minLength={2}
                maxLength={80}
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                aria-describedby="password-help"
                required
                disabled={busy}
              />
              <p id="password-help" className="text-xs text-muted-foreground">
                Au moins 12 caractères. Une phrase longue fonctionne très bien.
              </p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={busy || !isSupabaseConfigured}
            >
              {busy && <Loader2 size={16} className="animate-spin" />}Créer mon
              espace
              <ArrowRight size={15} />
            </Button>
          </form>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Consultez les <Link to="/legal/terms" className="underline">conditions d’utilisation</Link> et notre <Link to="/legal/privacy" className="underline">politique de confidentialité</Link> avant de créer votre compte.
        </p>
        <p className="mt-9 border-t pt-6 text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-primary">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
