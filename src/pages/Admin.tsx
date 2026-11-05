import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encodeCsv } from "@/lib/csv";
import { readAllPages } from "@/lib/pagination";

type DirectoryProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  admin: boolean;
  restricted: boolean;
};

export default function Admin() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const verification = useQuery({
    queryKey: ["admin-verification", user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("verify-admin");
      if (error) throw error;
      return data?.isAdmin === true;
    },
  });
  const directory = useQuery({
    queryKey: ["admin-directory", user?.id],
    enabled: verification.data === true,
    queryFn: async () => {
      return readAllPages<DirectoryProfile>(async (offset) => {
        const { data, error } = await supabase.functions.invoke<{
          profiles: DirectoryProfile[];
        }>("verify-admin", {
          body: { action: "directory", offset },
        });
        if (error) throw error;
        if (!Array.isArray(data?.profiles))
          throw new Error("Réponse de l’annuaire invalide.");
        return { data: data.profiles, error: null };
      });
    },
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");
    return (directory.data ?? []).filter((profile) =>
      `${profile.email ?? ""} ${profile.display_name ?? ""}`
        .toLocaleLowerCase("fr")
        .includes(term),
    );
  }, [directory.data, search]);
  const exportCsv = () => {
    if (!directory.data) return;
    const csv = encodeCsv([
      [
        "Email",
        "Nom",
        "Date d’inscription",
        "Restriction enregistrée",
        "Admin",
      ],
      ...filtered.map((profile) => [
        profile.email,
        profile.display_name,
        profile.created_at,
        profile.restricted ? "Oui" : "Non",
        profile.admin ? "Oui" : "Non",
      ]),
    ]);
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deepflow-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (verification.isPending)
    return <p role="status">Vérification des droits…</p>;
  if (verification.isError)
    return (
      <div className="panel p-6" role="alert">
        <p>Les droits d’administration ne peuvent pas être vérifiés.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void verification.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  if (!verification.data) return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="eyebrow mb-3">SUPERVISION</p>
        <h1 className="page-title">
          Administration<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Annuaire accessible après vérification des droits d’administration par
          le serveur.
        </p>
      </div>
      <section className="panel flex gap-3 p-5">
        <ShieldCheck className="shrink-0 text-primary" size={20} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les crédits et abonnements sont calculés côté serveur à partir des
          paiements vérifiés. Leur modification et la suppression globale des
          données ne sont pas proposées dans cette interface.
        </p>
      </section>
      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Utilisateurs</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={directory.isFetching}
              onClick={() => void directory.refetch()}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={!directory.data || directory.isError}
              className="gap-2"
            >
              <Download size={16} />
              Exporter
            </Button>
          </div>
        </div>
        <label className="relative block max-w-md">
          <Search
            aria-hidden="true"
            size={16}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <span className="sr-only">Rechercher un utilisateur</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Adresse ou nom…"
            className="pl-10"
          />
        </label>
        {directory.isPending ? (
          <p role="status" className="mt-5">
            Chargement des utilisateurs…
          </p>
        ) : directory.isError ? (
          <p role="alert" className="mt-5 text-destructive">
            Les utilisateurs n’ont pas pu être chargés. Actualisez pour
            réessayer.
          </p>
        ) : (
          <>
            <p className="my-4 text-xs text-muted-foreground">
              {filtered.length} résultat(s) sur {directory.data.length}{" "}
              profil(s) accessible(s). L’export respecte la recherche.
            </p>
            <ul className="divide-y">
              {filtered.map((profile) => (
                <li
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium">
                      {profile.email || "Adresse non renseignée"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.display_name || "Sans nom"}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {profile.admin && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                        Admin
                      </span>
                    )}
                    {profile.restricted && (
                      <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">
                        Restriction enregistrée
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {!filtered.length && (
                <li className="py-6 text-sm text-muted-foreground">
                  Aucun profil ne correspond à cette recherche.
                </li>
              )}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
