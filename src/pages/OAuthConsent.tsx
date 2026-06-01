import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

interface AppInfo {
  name: string;
  description: string | null;
  homepage_url: string | null;
  redirect_uris: string[];
}

export default function OAuthConsent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [app, setApp] = useState<AppInfo | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const client_id = params.get("client_id") ?? "";
  const redirect_uri = params.get("redirect_uri") ?? "";
  const scopeParam = params.get("scope") ?? "";
  const state = params.get("state") ?? "";
  const code_challenge = params.get("code_challenge") ?? "";
  const code_challenge_method = params.get("code_challenge_method") ?? "";
  const requestedScopes = scopeParam.split(/[\s+]/).filter(Boolean);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Redirect to login, then return here.
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("oauth_apps")
        .select("name, description, homepage_url, redirect_uris")
        .eq("client_id", client_id)
        .maybeSingle();
      if (!data) {
        toast.error("Application inconnue");
        setLoading(false);
        return;
      }
      if (!data.redirect_uris.includes(redirect_uri)) {
        toast.error("Redirect URI non autorisée");
        setLoading(false);
        return;
      }
      if (code_challenge_method !== "S256" || !code_challenge) {
        toast.error("PKCE S256 requis");
        setLoading(false);
        return;
      }
      setApp(data as AppInfo);
      setSelectedScopes(requestedScopes);
      setLoading(false);
    })();
  }, [user, isLoading, client_id, redirect_uri]);

  function toggleScope(s: string) {
    setSelectedScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function buildRedirect(base: string, qs: Record<string, string>) {
    const u = new URL(base);
    for (const [k, v] of Object.entries(qs)) u.searchParams.set(k, v);
    return u.toString();
  }

  async function approve() {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("oauth-authorize", {
        body: {
          client_id,
          redirect_uri,
          scopes: selectedScopes,
          code_challenge,
          code_challenge_method,
        },
      });
      if (error || !data?.code) throw error ?? new Error("no_code");
      window.location.href = buildRedirect(redirect_uri, { code: data.code, state });
    } catch (e) {
      toast.error("Autorisation impossible");
      setSubmitting(false);
    }
  }

  function deny() {
    window.location.href = buildRedirect(redirect_uri, { error: "access_denied", state });
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <p>Demande d'autorisation invalide.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>Retour</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 backdrop-blur-xl bg-card/80 border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">{app.name}</h1>
            <p className="text-xs text-muted-foreground">souhaite accéder à votre compte DeepFlow</p>
          </div>
        </div>

        {app.description && (
          <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Cette application pourra :</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {requestedScopes.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedScopes.includes(s)}
                  onCheckedChange={() => toggleScope(s)}
                />
                <span className="font-mono text-xs">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Vous pouvez révoquer cet accès à tout moment depuis <span className="font-medium">/developers → Apps connectées</span>.
        </p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={deny} disabled={submitting}>Refuser</Button>
          <Button className="flex-1" onClick={approve} disabled={submitting || selectedScopes.length === 0}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Autoriser"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
