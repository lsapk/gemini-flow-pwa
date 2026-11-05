import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export default function Login() {
  const { user, signIn, resetPassword } = useAuth();
  const location = useLocation();
  const [reset, setReset] = useState(location.pathname === "/forgot-password"),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const from =
    typeof location.state?.from === "string" &&
    /^\/(?!\/)/.test(location.state.from)
      ? location.state.from
      : "/dashboard";
  if (user) return <Navigate to={from} replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const fields = new FormData(event.currentTarget);
    try {
      const email = String(fields.get("email") || "");
      const result = reset
        ? await resetPassword(email)
        : await signIn(email, String(fields.get("password") || ""));
      if (result.error)
        setError(
          reset
            ? "Le lien n’a pas pu être envoyé. Réessayez dans quelques instants."
            : "Connexion impossible. Vérifiez votre adresse, votre mot de passe et la confirmation de votre compte.",
        );
      else if (reset)
        setNotice(
          "Si un compte correspond à cette adresse, un lien de réinitialisation vous a été envoyé.",
        );
    } catch {
      setError(
        "Connexion indisponible. Vérifiez votre connexion et réessayez.",
      );
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
        <h1 className="page-title">
          {reset ? "Un nouveau départ." : "Heureux de vous retrouver."}
        </h1>
        <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
          {reset
            ? "Recevez un lien pour choisir un nouveau mot de passe."
            : "Votre journée mérite un peu de clarté."}
        </p>
        {!isSupabaseConfigured && (
          <div
            role="status"
            className="mb-6 rounded-xl border bg-card p-4 text-sm leading-relaxed"
          >
            La connexion est disponible après configuration de Supabase.{" "}
            <Link to="/preview" className="font-medium text-primary underline">
              Découvrir l’interface
            </Link>
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@universite.fr"
              spellCheck={false}
              required
              disabled={busy}
            />
          </div>
          {!reset && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  className="pr-12"
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground"
                  onClick={() => setVisible(!visible)}
                  aria-label={
                    visible
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="text-sm text-emerald-700 dark:text-emerald-300"
            >
              {notice}
            </p>
          )}
          <Button
            disabled={busy || !isSupabaseConfigured}
            type="submit"
            className="w-full gap-2"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {reset ? "Envoyer le lien" : "Se connecter"}
            <ArrowRight size={15} />
          </Button>
        </form>
        <button
          className="mt-5 text-xs text-muted-foreground hover:text-primary"
          onClick={() => {
            setReset(!reset);
            setNotice("");
            setError("");
          }}
        >
          {reset ? "Revenir à la connexion" : "Mot de passe oublié ?"}
        </button>
        <p className="mt-9 border-t pt-6 text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link className="font-medium text-primary" to="/register">
            Créer mon espace
          </Link>
        </p>
      </div>
    </div>
  );
}
