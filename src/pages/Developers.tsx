import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Trash2, Plus, ExternalLink, Code2, Shield, ScrollText } from "lucide-react";

interface OAuthApp {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  homepage_url: string | null;
  redirect_uris: string[];
  created_at: string;
}

interface Consent {
  id: string;
  client_id: string;
  scopes: string[];
  granted_at: string;
  revoked_at: string | null;
}

interface LogRow {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  duration_ms: number | null;
  created_at: string;
}

const ALL_SCOPES = [
  "tasks:read", "tasks:write",
  "habits:read", "habits:write",
  "goals:read", "goals:write",
  "focus:read", "focus:write",
  "journal:read", "journal:write",
  "reflection:read", "reflection:write",
  "lessons:read", "lessons:write",
  "analytics:read",
  "profile:read", "profile:write",
  "settings:read",
  "community:read", "community:write",
  "data:export",
];

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(len = 32) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function Developers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", homepage_url: "", redirect_uris: "" });
  const [createdSecret, setCreatedSecret] = useState<{ client_id: string; client_secret: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadAll();
  }, [user]);

  async function loadAll() {
    const [a, c, l] = await Promise.all([
      supabase.from("oauth_apps").select("*").order("created_at", { ascending: false }),
      supabase.from("oauth_user_consents").select("*").is("revoked_at", null).order("granted_at", { ascending: false }),
      supabase.from("api_request_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (a.data) setApps(a.data as OAuthApp[]);
    if (c.data) setConsents(c.data as Consent[]);
    if (l.data) setLogs(l.data as LogRow[]);
  }

  async function createApp() {
    if (!form.name.trim() || !form.redirect_uris.trim()) {
      toast.error("Nom et redirect URI requis");
      return;
    }
    const client_id = "df_" + randomToken(16);
    const client_secret = randomToken(32);
    const client_secret_hash = await sha256Hex(client_secret);
    const redirect_uris = form.redirect_uris.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

    const { error } = await supabase.from("oauth_apps").insert({
      client_id,
      client_secret_hash,
      name: form.name,
      description: form.description || null,
      homepage_url: form.homepage_url || null,
      redirect_uris,
      owner_user_id: user!.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCreatedSecret({ client_id, client_secret });
    setForm({ name: "", description: "", homepage_url: "", redirect_uris: "" });
    setOpen(false);
    loadAll();
  }

  async function deleteApp(id: string) {
    if (!confirm("Supprimer cette application ? Tous ses tokens deviendront invalides.")) return;
    const { error } = await supabase.from("oauth_apps").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application supprimée");
    loadAll();
  }

  async function revokeConsent(consent: Consent) {
    const { error } = await supabase
      .from("oauth_user_consents")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", consent.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Also revoke tokens of this app for this user
    await supabase
      .from("oauth_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("client_id", consent.client_id)
      .eq("user_id", user!.id)
      .is("revoked_at", null);
    toast.success("Accès révoqué");
    loadAll();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copié");
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Code2 className="w-7 h-7 text-primary" />
          DeepFlow Developer API
        </h1>
        <p className="text-muted-foreground">
          Construisez vos propres apps connectées à vos données DeepFlow via OAuth 2.0.
        </p>
      </div>

      <Tabs defaultValue="apps">
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="apps">Mes applications</TabsTrigger>
          <TabsTrigger value="connected">Apps connectées</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* --- Mes apps --- */}
        <TabsContent value="apps" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nouvelle application
            </Button>
          </div>
          {apps.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              Aucune application. Créez-en une pour obtenir vos identifiants OAuth.
            </Card>
          )}
          {apps.map((app) => (
            <Card key={app.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{app.name}</h3>
                  {app.description && <p className="text-sm text-muted-foreground mb-2">{app.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-mono">{app.client_id}</span>
                    <button onClick={() => copy(app.client_id)} className="hover:text-primary">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Redirect URIs : {app.redirect_uris.join(", ")}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteApp(app.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* --- Connected apps --- */}
        <TabsContent value="connected" className="space-y-4">
          {consents.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              Aucune application tierce connectée à votre compte.
            </Card>
          )}
          {consents.map((c) => (
            <Card key={c.id} className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm mb-2">{c.client_id}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.scopes.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Autorisé le {new Date(c.granted_at).toLocaleString("fr-FR")}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => revokeConsent(c)}>
                <Shield className="w-3 h-3 mr-1" /> Révoquer
              </Button>
            </Card>
          ))}
        </TabsContent>

        {/* --- Docs --- */}
        <TabsContent value="docs" className="space-y-4 text-sm">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Démarrage rapide</h2>
            <p>L'API DeepFlow utilise <strong>OAuth 2.0 Authorization Code + PKCE</strong>.</p>

            <h3 className="font-semibold mt-4">1. Rediriger l'utilisateur vers la page de consentement</h3>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`${window.location.origin}/oauth/consent
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://your-app.com/callback
  &scope=tasks:read+habits:write
  &state=random_state
  &code_challenge=BASE64URL_SHA256(verifier)
  &code_challenge_method=S256`}
            </pre>

            <h3 className="font-semibold mt-4">2. Échanger le code contre un access token</h3>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`POST https://xzgdfetnjnwrberyddmf.functions.supabase.co/oauth-token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "<code reçu>",
  "code_verifier": "<le verifier>",
  "redirect_uri": "https://your-app.com/callback"
}`}
            </pre>

            <h3 className="font-semibold mt-4">3. Appeler l'API</h3>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`GET https://xzgdfetnjnwrberyddmf.functions.supabase.co/api-v1-router/v1/tasks
Authorization: Bearer <access_token>`}
            </pre>

            <h3 className="font-semibold mt-4">Ressources disponibles</h3>
            <ul className="grid grid-cols-2 gap-1 list-disc pl-5">
              <li>/v1/me · /v1/settings · /v1/export</li>
              <li>/v1/tasks</li>
              <li>/v1/habits · /v1/habit-completions</li>
              <li>/v1/goals</li>
              <li>/v1/focus-sessions</li>
              <li>/v1/journal · /v1/reflections</li>
              <li>/v1/lessons · /v1/good-actions</li>
              <li>/v1/insights · /v1/analysis · /v1/personality-profile</li>
              <li>/v1/ai-credits · /v1/daily-usage</li>
            </ul>

            <h3 className="font-semibold mt-4">Scopes</h3>
            <div className="flex flex-wrap gap-1">
              {ALL_SCOPES.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
            </div>
          </Card>
        </TabsContent>

        {/* --- Logs --- */}
        <TabsContent value="logs" className="space-y-2">
          {logs.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">Aucun appel API enregistré.</Card>
          )}
          {logs.map((l) => (
            <Card key={l.id} className="p-3 flex items-center gap-3 text-sm">
              <Badge variant={l.status_code < 400 ? "default" : "destructive"}>{l.status_code}</Badge>
              <span className="font-mono">{l.method}</span>
              <span className="flex-1 truncate font-mono">{l.endpoint}</span>
              <span className="text-xs text-muted-foreground">{l.duration_ms ?? "-"}ms</span>
              <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("fr-FR")}</span>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Create app dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle application</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Site web</Label>
              <Input value={form.homepage_url} onChange={(e) => setForm({ ...form, homepage_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Redirect URIs * (un par ligne)</Label>
              <Textarea
                value={form.redirect_uris}
                onChange={(e) => setForm({ ...form, redirect_uris: e.target.value })}
                placeholder="https://your-app.com/callback"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={createApp}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret one-time dialog */}
      <Dialog open={!!createdSecret} onOpenChange={() => setCreatedSecret(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vos identifiants OAuth</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              ⚠️ Conservez le <strong>client secret</strong> dès maintenant : il ne sera plus jamais affiché.
            </p>
            <div>
              <Label>Client ID</Label>
              <div className="flex gap-2">
                <Input readOnly value={createdSecret?.client_id ?? ""} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(createdSecret!.client_id)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Client Secret</Label>
              <div className="flex gap-2">
                <Input readOnly value={createdSecret?.client_secret ?? ""} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(createdSecret!.client_secret)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedSecret(null)}>J'ai sauvegardé</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
