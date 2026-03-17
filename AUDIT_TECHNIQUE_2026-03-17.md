# Audit technique DeepFlow (sécurité, UX/UI, fonctionnalités, dette)

Date: 2026-03-17  
Portée: revue statique du code + checks de build/lint.

## 1) Failles de sécurité et risques

### S1 — Chiffrement OAuth non implémenté (critique)
- La fonction `encrypt_token` est présentée comme sécurité, mais renvoie le token en clair (`encrypted_token := token`).
- Impact: tokens Google stockés lisibles en base si un accès DB est compromis.
- Fichier: `supabase/migrations/20251005102846_77514b57-3f29-44f1-9563-754f23ce84bc.sql`.

### S2 — Redirect URI OAuth dérivée du header `Origin` (élevé)
- `REDIRECT_URI` est construit depuis `req.headers.get('origin')` dans le flow OAuth Google.
- Impact: risque de mauvaise redirection / confusion de domaine si l’origin n’est pas strictement contrôlée côté infra.
- Fichier: `supabase/functions/google-calendar-oauth/index.ts`.

### S3 — Endpoint contact exposé sans anti-abus (élevé)
- `send-contact` accepte des requêtes cross-origin (`Access-Control-Allow-Origin: *`), sans auth, sans rate-limit/captcha.
- Impact: spam massif, coûts infra, saturation logs.
- Fichier: `supabase/functions/send-contact/index.ts`.

### S4 — Données analytics globales lisibles par tout utilisateur authentifié (moyen)
- Politiques RLS `USING (true)` pour tables analytics.
- Impact: fuite de données analytiques inter-utilisateurs selon contenu de ces tables.
- Fichier: `supabase/migrations/20250909170326_a7aa608b-f156-486b-9232-ff66887cf7d0.sql`.

## 2) Problèmes de fonctionnalités (dont streaks)

### F1 — Les streaks de connexion badges ne fonctionnent pas
- `loginStreak` est forcé à `0` avec un `TODO`.
- Impact: badges de régularité jamais débloqués.
- Fichier: `src/pages/Badges.tsx`.

### F2 — Streak analytics basé sur `max(habit.streak)` stocké, pas recalculé globalement
- `streakCount` prend le maximum des streaks persistés dans `habits`.
- Impact: valeur potentiellement obsolète/incohérente si des habitudes ne sont pas recalculées récemment.
- Fichier: `src/hooks/useAnalyticsData.tsx`.

### F3 — Bug potentiel de date (timezone) pour les habitudes
- Plusieurs dates métier sont dérivées via `toISOString().split('T')[0]`.
- Impact: décalage d’un jour possible selon fuseau, donc validations/streaks erronées autour de minuit.
- Fichier: `src/pages/Habits.tsx`.

### F4 — Paiement Stripe probablement non opérationnel en prod
- `create-checkout` utilise des IDs prix placeholders (`price_monthly`, `price_yearly`, `price_lifetime`).
- Impact: échec création session checkout si non remplacé.
- Fichier: `supabase/functions/create-checkout/index.ts`.

### F5 — Chat IA ignore l’historique envoyé
- Le body lit `chatHistory` mais n’envoie au modèle que `system + user` courant.
- Impact: perte de contexte conversationnel, qualité réponse dégradée.
- Fichier: `supabase/functions/gemini-chat/index.ts`.

## 3) Problèmes d’interface / UX / perf

### U1 — Bundle front très lourd
- Build signale des chunks > 500kB, dont `Markdown` (~803kB) et `index` (~586kB).
- Impact: temps de chargement initial élevé, UX mobile dégradée.

### U2 — Incohérence politique mot de passe
- Inscription exige mot de passe complexe (8+ avec maj/min/chiffre), mais paramètres acceptent 6 caractères minimum.
- Impact: expérience incohérente, surface d’erreur support.
- Fichiers: `src/pages/Register.tsx`, `src/pages/Settings.tsx`.

## 4) Code inutile / dette technique

### D1 — Endpoint officiellement déprécié encore présent
- `validate-purchase` retourne systématiquement `410 Gone`.
- Impact: code mort à retirer ou à documenter explicitement dans le routage client.
- Fichier: `supabase/functions/validate-purchase/index.ts`.

### D2 — Dette qualité importante détectée par lint
- `eslint` remonte **173 problèmes** (135 erreurs, 38 warnings), notamment `any`, dépendances de hooks, imports/structures.
- Impact: régressions probables, maintenance difficile.

## 5) Recommandations prioritaires

1. **Corriger immédiatement S1**: vrai chiffrement des tokens OAuth (pgcrypto/KMS) + rotation clés.
2. **Sécuriser OAuth (S2)**: `REDIRECT_URI` côté serveur via allowlist stricte, jamais depuis `Origin` brut.
3. **Ajouter anti-abus sur `send-contact` (S3)**: captcha + rate limit IP/user + honeypot.
4. **Fix streaks**: implémenter `loginStreak` réel et un calcul robuste timezone-aware (dates locales métier).
5. **Réparer checkout**: brancher vrais `price_*` IDs via variables d’environnement.
6. **Plan qualité**: réduire erreurs lint critiques et introduire CI bloquante minimale (lint + build).
7. **Perf front**: lazy-load composants lourds, splitting ciblé, audit dépendances markdown/charts.
