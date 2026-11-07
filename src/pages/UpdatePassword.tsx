import AuthFrame from "@/components/layout/AuthFrame";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/layout/Sidebar";
export default function UpdatePassword() {
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Supabase consumes the link asynchronously, before or after this page mounts.
    void supabase.auth
      .getSession()
      .then(({ data }) => setReady(Boolean(data.session)));
    return () => subscription.unsubscribe();
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirm")) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const result = await supabase.auth.updateUser({
        password: String(data.get("password")),
      });
      if (result.error)
        setError("Le lien a peut-être expiré. Demandez un nouveau lien.");
      else setDone(true);
    } catch {
      setError("La modification a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame>
      <Brand />
      <h1 className="mb-8 mt-9 text-2xl font-semibold">Nouveau mot de passe</h1>
      {done ? (
        <p role="status">
          Mot de passe enregistré.{" "}
          <Link to="/dashboard" className="text-primary underline">
            Ouvrir mon espace
          </Link>
        </p>
      ) : ready ? (
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button disabled={busy} type="submit">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ouvrez le lien reçu par e-mail. S’il a expiré,{" "}
          <Link to="/login" className="text-primary underline">
            demandez un nouveau lien depuis la connexion
          </Link>
          .
        </p>
      )}
    </AuthFrame>
  );
}
