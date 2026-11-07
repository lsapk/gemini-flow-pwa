import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAIUsage } from "@/utils/aiLimits";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
export default function Credits() {
  const { user } = useAuth();
  const usage = useQuery({
    queryKey: ["ai-usage", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const data = await getAIUsage();
      if (!data) throw new Error("Le quota est indisponible.");
      return data;
    },
  });
  return (
    <div className="max-w-4xl space-y-7">
      <div className="page-intro">
        <p className="eyebrow mb-3">SIMPLE ET TRANSPARENT</p>
        <h1 className="page-title">
          Vos crédits IA<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un quota partagé entre l’assistant et les analyses.
        </p>
      </div>
      <section className="quota-panel panel p-7">
        <div className="mb-7 flex items-center justify-between">
          <span className="rounded-lg bg-primary/10 p-3 text-primary">
            <Coins size={21} />
          </span>
          <Button
            aria-label="Actualiser le quota IA"
            size="icon"
            variant="ghost"
            disabled={usage.isFetching}
            onClick={() => void usage.refetch()}
          >
            <RefreshCw
              size={17}
              className={usage.isFetching ? "animate-spin" : ""}
            />
          </Button>
        </div>
        {usage.isLoading ? (
          <p role="status">Chargement de votre quota…</p>
        ) : usage.isError ? (
          <div role="alert">
            <h2 className="font-semibold">
              Le quota ne peut pas être vérifié.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vérifiez la connexion et le déploiement des migrations, puis
              actualisez. Aucun crédit disponible n’est supposé en cas d’erreur.
            </p>
          </div>
        ) : (
          usage.data && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Formule {usage.data.tier}
              </p>
              <h2 className="mt-3 text-5xl font-semibold tracking-tight">
                {usage.data.remaining}
                <span className="ml-2 text-lg font-normal text-muted-foreground">
                  / {usage.data.daily_limit} crédits
                </span>
              </h2>
              <div
                role="progressbar"
                aria-label="Crédits IA restants"
                aria-valuemin={0}
                aria-valuemax={usage.data.daily_limit}
                aria-valuenow={usage.data.remaining}
                className="my-6 h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${usage.data.daily_limit ? (usage.data.remaining / usage.data.daily_limit) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {usage.data.used} crédit{usage.data.used > 1 ? "s" : ""} utilisé
                {usage.data.used > 1 ? "s" : ""} · Renouvellement le{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Europe/Paris",
                }).format(new Date(usage.data.resets_at))}{" "}
                (Paris)
              </p>
              <Button
                asChild
                className="mt-6 gap-2"
                disabled={!usage.data.remaining}
              >
                <Link to="/ai-assistant">
                  <Sparkles size={15} />
                  Ouvrir l’assistant
                </Link>
              </Button>
            </>
          )
        )}
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="panel p-6">
          <ShieldCheck className="mb-4 text-primary" size={22} />
          <h2 className="text-sm font-semibold">
            Un crédit, une demande réussie.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Le serveur réserve un crédit avant chaque demande. Si le fournisseur
            renvoie une erreur, la réservation est remboursée. Les quotas
            empêchent les dépenses illimitées.
          </p>
        </section>
        <section className="panel p-6">
          <h2 className="text-sm font-semibold">Votre abonnement</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Les droits payants sont activés après vérification du paiement par
            Stripe. Consultez votre abonnement depuis les paramètres.
          </p>
          <Link
            to="/settings"
            className="mt-5 inline-flex items-center gap-2 text-sm text-primary"
          >
            Gérer mon compte
            <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}
