

# Plan: Corrections pre-production DeepFlow

## Vue d'ensemble

6 axes pour passer de NO-GO a GO : lint cleanup, securite Stripe, RLS analytics (faux positif), bundle splitting, encrypt_token, et suppression imports lourds.

## 1. Fix 106 erreurs lint

La quasi-totalite sont des `@typescript-eslint/no-explicit-any`. Approche systematique :

- **Typer les `any` evidents** : remplacer par les types concrets (`Error`, `Record<string, unknown>`, `React.ChangeEvent`, etc.) dans ~25 fichiers
- **2 erreurs `no-unused-expressions`** dans `useAIDailyBriefing.ts` et `useAIInsightsEngine.ts` — corriger la syntaxe (probablement des ternaires sans assignation)
- **2 erreurs `no-empty-object-type`** dans `command.tsx` et `textarea.tsx` — remplacer `interface X extends Y {}` par `type X = Y`
- **1 erreur `no-irregular-whitespace`** dans `JournalMoodSummary.tsx`

Objectif : **0 erreur lint**.

## 2. Securiser les redirections Stripe (origin allowlist)

Dans `create-checkout`, `customer-portal`, et `paypal-create-order` :

```ts
const ALLOWED_ORIGINS = [
  "https://deepflowia.lovable.app",
  "https://deepflow.app", // futur domaine custom
  "http://localhost:8080",
];
const origin = req.headers.get("origin") || "";
const safeOrigin = ALLOWED_ORIGINS.includes(origin)
  ? origin
  : ALLOWED_ORIGINS[0];
```

Utiliser `safeOrigin` au lieu de `origin` brut pour `success_url` et `cancel_url`.

## 3. RLS analytics — faux positif

Les tables `analytics_by_period`, `analytics_metadata`, `analytics_raw` n'ont **pas de colonne `user_id`** — ce sont des donnees globales partagees. Les policies `USING (true)` sont correctes ici. Aucune action requise, mais je documenterai la decision.

## 4. Bundle splitting — reduire les 3 gros chunks

**Markdown (803 kB)** : `react-syntax-highlighter` inclut TOUS les langages Prism. Fix :
- Importer uniquement les langages necessaires (js, ts, json, bash, css)
- Lazy-load le composant `Markdown` via `React.lazy`

**BarChart (367 kB)** : Recharts — deja lazy-loaded via les pages. Ajouter `manualChunks` dans vite config pour isoler recharts.

**index (588 kB)** : chunk principal — ajouter `manualChunks` pour separer `framer-motion`, `date-fns`, et les composants UI lourds.

```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'recharts': ['recharts'],
        'framer': ['framer-motion'],
        'markdown': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
        'dates': ['date-fns'],
      }
    }
  }
}
```

## 5. encrypt_token — vrai chiffrement

Migration SQL pour remplacer le placeholder par pgcrypto :

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.encrypt_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(token, current_setting('app.settings.token_secret', true)),
    'base64'
  );
END;
$$;
```

Note : necessite de definir `app.settings.token_secret` comme parametre de configuration Supabase, ou utiliser un secret edge function. Si le secret n'est pas configure, on utilisera une cle derivee du service role key.

## 6. Ajouter config webhook Stripe dans config.toml

Ajouter la declaration de la fonction `stripe-webhook` dans `supabase/config.toml` avec `verify_jwt = false` (Stripe signe ses propres requetes).

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| ~25 fichiers src/ | Fix `any` → types concrets |
| `src/hooks/useAIDailyBriefing.ts` | Fix unused expression |
| `src/hooks/useAIInsightsEngine.ts` | Fix unused expression |
| `src/components/ui/command.tsx` | Fix empty interface |
| `src/components/ui/textarea.tsx` | Fix empty interface |
| `src/components/JournalMoodSummary.tsx` | Fix whitespace |
| `src/components/Markdown.tsx` | Import selectif Prism + lazy |
| `vite.config.ts` | manualChunks pour bundle split |
| `supabase/functions/create-checkout/index.ts` | Origin allowlist |
| `supabase/functions/customer-portal/index.ts` | Origin allowlist |
| `supabase/functions/paypal-create-order/index.ts` | Origin allowlist |
| `supabase/config.toml` | Ajouter stripe-webhook |
| Migration SQL | Fix encrypt_token avec pgcrypto |

## Estimation

Gros volume de fichiers mais changements mecaniques (typage). Le plus impactant pour la securite : origin allowlist + encrypt_token.

