import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerPortal,
  createCheckoutSession,
  checkSubscriptionStatus,
} from "@/services/billing";
import { toast } from "sonner";
export default function Settings() {
  const { user, signOut, resetPassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const soundSetting = useQuery({
    queryKey: ["sound-setting", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("sound_enabled")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.sound_enabled ?? false;
    },
  });
  const toggleSound = async () => {
    setBusy(true);
    try {
      const enabled = !soundSetting.data;
      const { error } = await supabase
        .from("user_settings")
        .upsert({ id: user!.id, sound_enabled: enabled }, { onConflict: "id" });
      if (error) throw error;
      queryClient.setQueryData(["sound-setting", user!.id], enabled);
      toast.success(
        enabled ? "Effets sonores activés." : "Effets sonores désactivés.",
      );
    } catch {
      toast.error("La préférence sonore n’a pas pu être enregistrée.");
    } finally {
      setBusy(false);
    }
  };
  const profile = useQuery({
    queryKey: ["account-profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const result = await supabase
        .from("user_profiles")
        .select("display_name,bio")
        .eq("id", user!.id)
        .maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const subscription = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const result = await checkSubscriptionStatus();
      if (result.error) throw new Error(result.error);
      return result;
    },
  });
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const data = new FormData(event.currentTarget);
    const displayName = String(data.get("display_name") || "").trim();
    try {
      const result = await supabase.from("user_profiles").upsert(
        {
          id: user!.id,
          display_name: displayName,
          bio: String(data.get("bio") || "").trim() || null,
        },
        { onConflict: "id" },
      );
      if (result.error) throw result.error;
      const authResult = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (authResult.error) throw authResult.error;
      await queryClient.invalidateQueries({
        queryKey: ["account-profile", user!.id],
      });
      setNotice("Profil enregistré.");
    } catch {
      setNotice(
        "Le profil n’a pas pu être enregistré. Vérifiez la connexion, puis réessayez.",
      );
    } finally {
      setBusy(false);
    }
  };
  const portal = async () => {
    setBusy(true);
    try {
      const result = await createCustomerPortal();
      if (result.error || !result.url)
        throw new Error(
          "Portail indisponible. Vérifiez qu’un abonnement Stripe est associé à votre compte.",
        );
      const target = new URL(result.url);
      if (
        target.protocol !== "https:" ||
        target.hostname !== "billing.stripe.com"
      )
        throw new Error("URL de paiement invalide.");
      window.location.assign(target.href);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Portail indisponible.",
      );
    } finally {
      setBusy(false);
    }
  };
  const checkout = async (plan: "basic" | "premium" | "ultimate") => {
    setBusy(true);
    try {
      const result = await createCheckoutSession(plan);
      if (result.error || !result.url)
        throw new Error(
          "Cette formule n’est pas disponible. Vérifiez la configuration Stripe.",
        );
      const target = new URL(result.url);
      if (
        target.protocol !== "https:" ||
        target.hostname !== "checkout.stripe.com"
      )
        throw new Error("URL de paiement invalide.");
      window.location.assign(target.href);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Paiement indisponible.",
      );
    } finally {
      setBusy(false);
    }
  };
  const exportData = async () => {
    setBusy(true);
    try {
      const output: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        version: 1,
      };
      for (const table of [
        "tasks",
        "goals",
        "habits",
        "journal_entries",
        "focus_sessions",
        "habit_completions",
        "daily_reflections",
        "subtasks",
        "subobjectives",
      ] as const) {
        const rows: unknown[] = [];
        for (let page = 0; ; page += 1) {
          const result = await supabase
            .from(table)
            .select("*")
            .eq("user_id", user!.id)
            .order("id")
            .range(page * 500, (page + 1) * 500 - 1);
          if (result.error) throw result.error;
          rows.push(...result.data);
          if (result.data.length < 500) break;
        }
        output[table] = rows;
      }
      const exportedProfile = await supabase
        .from("user_profiles")
        .select("display_name,bio")
        .eq("id", user!.id)
        .maybeSingle();
      if (exportedProfile.error) throw exportedProfile.error;
      output.profile = exportedProfile.data;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(output, null, 2)], {
          type: "application/json",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "deepflow-mes-donnees.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(
        "Export téléchargé. Il contient notamment votre journal personnel.",
      );
    } catch {
      toast.error(
        "L’export a échoué. Aucune donnée incomplète n’a été téléchargée.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="max-w-4xl space-y-7">
      <div>
        <p className="eyebrow mb-3">À VOTRE IMAGE</p>
        <h1 className="page-title">
          Paramètres<span className="text-primary">.</span>
        </h1>
      </div>
      <section className="panel p-6">
        <h2 className="mb-5 text-base font-semibold">Votre profil</h2>
        {profile.isLoading ? (
          <p role="status">Chargement…</p>
        ) : profile.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Le profil n’a pas pu être chargé.{" "}
            <button
              onClick={() => void profile.refetch()}
              className="underline"
            >
              Réessayer
            </button>
          </p>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Prénom ou pseudonyme</Label>
              <Input
                id="display_name"
                name="display_name"
                autoComplete="nickname"
                defaultValue={
                  profile.data?.display_name ||
                  user?.user_metadata?.display_name ||
                  ""
                }
                minLength={2}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">À propos de vous</Label>
              <Textarea
                id="bio"
                name="bio"
                maxLength={1000}
                defaultValue={profile.data?.bio || ""}
              />
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button disabled={busy} type="submit">
              Enregistrer le profil
            </Button>
            {notice && (
              <p role="status" className="text-sm">
                {notice}
              </p>
            )}
          </form>
        )}
      </section>
      <section className="panel p-6">
        <h2 className="text-base font-semibold">Apparence</h2>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          Le thème s’applique à cet appareil.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "light", label: "Clair", icon: Sun },
            { value: "dark", label: "Sombre", icon: Moon },
            { value: "system", label: "Système", icon: Monitor },
          ].map((item) => (
            <Button
              key={item.value}
              variant={theme === item.value ? "secondary" : "outline"}
              aria-pressed={theme === item.value}
              onClick={() => setTheme(item.value)}
              className="gap-2"
            >
              <item.icon size={16} />
              {item.label}
            </Button>
          ))}
        </div>
      </section>
      <section className="panel p-6">
        <h2 className="text-base font-semibold">Effets sonores</h2>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Des sons discrets accompagnent les actions sur vos habitudes.
        </p>
        {soundSetting.isError ? (
          <p role="alert" className="text-sm text-destructive">
            La préférence n’a pas pu être chargée.{" "}
            <button
              className="underline"
              onClick={() => void soundSetting.refetch()}
            >
              Réessayer
            </button>
          </p>
        ) : (
          <Button
            variant="outline"
            aria-pressed={Boolean(soundSetting.data)}
            disabled={busy || soundSetting.isPending}
            onClick={() => void toggleSound()}
          >
            {soundSetting.data ? "Désactiver les sons" : "Activer les sons"}
          </Button>
        )}
      </section>
      <section className="panel p-6">
        <h2 className="text-base font-semibold">Abonnement et crédits IA</h2>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          {subscription.isLoading
            ? "Vérification…"
            : subscription.isError
              ? "Abonnement non vérifiable actuellement."
              : subscription.data?.subscribed
                ? `Formule ${subscription.data.subscription_tier}`
                : "Formule gratuite. Les formules payantes sont vérifiées par Stripe."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/credits">Consulter mes crédits</Link>
          </Button>
          {subscription.data?.subscribed ? (
            <Button
              variant="outline"
              onClick={() => void portal()}
              disabled={busy}
            >
              Gérer dans Stripe
            </Button>
          ) : (
            <>
              {(["basic", "premium", "ultimate"] as const).map((plan) => (
                <Button
                  key={plan}
                  variant="outline"
                  disabled={busy}
                  onClick={() => void checkout(plan)}
                >
                  Voir la formule {plan}
                </Button>
              ))}
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Le prix et la périodicité sont affichés sur Stripe avant toute
          confirmation de paiement.
        </p>
      </section>
      <section className="panel p-6">
        <h2 className="text-base font-semibold">Compte et confidentialité</h2>
        <p className="my-3 text-sm leading-relaxed text-muted-foreground">
          Vos clés Google et IA sont gérées côté serveur. L’assistant demande
          votre accord avant d’inclure votre journal dans une analyse.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/connections">
              <Link2 size={15} className="mr-2" />
              Gérer mes connexions
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => void exportData()}
            disabled={busy}
          >
            <Download size={15} className="mr-2" />
            Exporter mes données principales
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              const result = await resetPassword(user!.email!);
              toast[result.error ? "error" : "success"](
                result.error
                  ? "Le lien n’a pas pu être envoyé."
                  : "Lien de réinitialisation envoyé.",
              );
            }}
          >
            Changer le mot de passe
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          L’export comprend tâches, objectifs, habitudes, journal, réflexions et
          sessions. Les données étudiantes disposent de leur propre export dans
          l’espace étudiant.
        </p>
      </section>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/support">Aide et support</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/developers">Applications et autorisations</Link>
        </Button>
      </div>
      <Button
        variant="outline"
        className="gap-2"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await signOut();
            if (result.error) toast.error("Déconnexion impossible. Réessayez.");
            else navigate("/login", { replace: true });
          } finally {
            setBusy(false);
          }
        }}
      >
        <LogOut size={16} />
        Se déconnecter
      </Button>
    </div>
  );
}
