# API DeepFlow pour développeurs — couverture complète des données

API REST sécurisée (OAuth 2.0) permettant à des apps tierces (dont la tienne d'analyse santé) de **lire, créer, modifier et supprimer la totalité** des données utilisateur DeepFlow après consentement explicite.

## 1. Architecture

```text
[App tierce] --(OAuth + PKCE)--> [/oauth/consent DeepFlow]
     |                                   |
     |<------ code (5 min, 1 usage) -----|
     |
     |--(POST /oauth/token)--> [edge: oauth-token]
     |<--- access_token (1h) + refresh_token (30j) ---
     |
     |--(Bearer)--> [edge: api-v1-router]
                          |
                  validation token + scope + rate limit
                          |
                          v
                  handler scoping STRICT par user_id
```

Tout via **Edge Functions Supabase** sous `/functions/v1/oauth-*` et `/functions/v1/api-v1/*`.

## 2. Couverture complète des ressources (v1)

Chaque ressource expose **GET (list + detail), POST, PATCH, DELETE** sauf mention.

### Productivité
- `/v1/tasks` — tâches + sous-tâches
- `/v1/habits` + `/v1/habits/:id/complete` + `/v1/habits/:id/completions` (historique)
- `/v1/goals` + sous-objectifs
- `/v1/focus-sessions` + `/v1/background-focus-sessions`

### Journal & introspection
- `/v1/journal` — entrées de journal (titre, contenu, mood, tags)
- `/v1/reflections` — réflexions quotidiennes (question/réponse)
- `/v1/lessons` — leçons / contenus d'apprentissage

### Analyse & IA (lecture seule, pas d'appels IA payants)
- `/v1/productivity-score` — score unifié + breakdown
- `/v1/insights` — `ai_productivity_insights` déjà calculés
- `/v1/analysis` — `ai_productivity_analysis` déjà calculés
- `/v1/personality-profile` — profil de personnalité IA
- `/v1/analytics/wheel-of-life`, `/analytics/chronobiology`, `/analytics/heatmap`

### Communauté & gamification
- `/v1/good-actions` (+ likes, commentaires)
- `/v1/achievements` (lecture)

### Profil & système
- `/v1/me` — profil utilisateur (display_name, email, photo, bio)
- `/v1/settings` — préférences utilisateur
- `/v1/ai-credits` — solde de crédits (lecture seule)
- `/v1/daily-usage` — usage journalier (lecture seule)
- `/v1/export` — export complet GDPR (toutes données en un JSON)

### Méta
- `/v1/openapi.json` — spec OpenAPI auto-générée

> Tables exclues : `oauth_*`, `admin_*`, `banned_users`, `user_roles`, tokens Google, et tables système (`execution_*`, `credentials_entity`, etc.) — non exposées via l'API.

## 3. Scopes granulaires

Format `domaine:action` (`read` ou `write`, write inclut create/update/delete).

```
tasks:read     tasks:write
habits:read    habits:write
goals:read     goals:write
focus:read     focus:write
journal:read   journal:write
reflection:read reflection:write
lessons:read   lessons:write
analytics:read
profile:read   profile:write
settings:read  settings:write
community:read community:write
data:export        (export complet)
```

L'utilisateur voit la liste exacte des scopes demandés sur l'écran de consentement et peut décocher individuellement.

## 4. Modèle de données (nouvelles tables)

- **`oauth_apps`** — `client_id` (public), `client_secret_hash` (SHA-256), `name`, `description`, `logo_url`, `homepage_url`, `redirect_uris[]`, `owner_user_id`, `is_verified`, `created_at`
- **`oauth_authorizations`** — `code_hash`, `client_id`, `user_id`, `redirect_uri`, `scopes[]`, `pkce_challenge`, `expires_at` (5 min), `used`
- **`oauth_tokens`** — `access_token_hash`, `refresh_token_hash`, `client_id`, `user_id`, `scopes[]`, `expires_at`, `revoked_at`, `last_used_at`
- **`oauth_user_consents`** — `user_id`, `client_id`, `scopes[]`, `granted_at`, `revoked_at` (vue "Apps connectées")
- **`api_rate_limits`** — `token_hash`, `window_start`, `request_count`
- **`api_request_logs`** — `client_id`, `user_id`, `endpoint`, `method`, `status_code`, `created_at` (rétention 90j)

RLS sur toutes : seul le propriétaire (et admins) voient leurs lignes. Tokens et secrets **toujours hashés**, jamais stockés en clair.

## 5. Flow OAuth 2.0 — Authorization Code + PKCE

1. App tierce → `/oauth/authorize?client_id=…&redirect_uri=…&scope=tasks:read+habits:write&state=…&code_challenge=…&code_challenge_method=S256`
2. DeepFlow exige login si nécessaire, puis affiche `/oauth/consent` (nom app, scopes, Autoriser/Refuser)
3. Sur Autoriser → `redirect_uri?code=…&state=…`
4. App → `POST /oauth/token` (`code`, `code_verifier`, `client_secret`) → `access_token` (1h) + `refresh_token` (30j, rotation à chaque usage)
5. Appels API : `Authorization: Bearer <access_token>`
6. Refresh : `POST /oauth/token` `grant_type=refresh_token`
7. Révocation : `POST /oauth/revoke` ou depuis l'UI utilisateur (`/developers` → Apps connectées)

## 6. Format de réponse normalisé

```json
{ "data": [...], "meta": { "next_cursor": "...", "count": 50 } }
```
Erreurs :
```json
{ "error": { "code": "insufficient_scope", "message": "...", "required_scope": "habits:write" } }
```
Codes : `400 invalid_request`, `401 invalid_token`, `403 insufficient_scope`, `404 not_found`, `409 conflict`, `422 validation_error`, `429 rate_limit_exceeded`, `500 internal_error`.

Pagination cursor-based (`?cursor=…&limit=50`, max 100).

## 7. Rate limiting & tiers

Middleware dans `api-v1-router` (table `api_rate_limits`, fenêtre glissante).

| Tier | Req/min | Req/jour |
|---|---|---|
| Free | 60 | 5 000 |
| Plus | 200 | 50 000 |
| Pro | 600 | 200 000 |

Headers : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Tier basé sur la subscription du **propriétaire de l'app**.

## 8. Edge Functions à créer

- `oauth-authorize` (verify_jwt = true) — crée le code après consentement
- `oauth-token` (verify_jwt = false) — échange code/refresh, valide `client_secret`
- `oauth-revoke` (verify_jwt = false) — révoque token
- `api-v1-router` (verify_jwt = false) — entrée unique : valide Bearer, scope, rate-limit, log, route vers handler interne

Chaque function : CORS complet, validation Zod, utilisation de `SUPABASE_SERVICE_ROLE_KEY` **uniquement après** extraction et vérification du `user_id` depuis le token (scoping manuel obligatoire pour respecter l'esprit RLS).

## 9. Portail développeurs (UI)

Nouvelle page **`/developers`** (lien dans Footer + Settings), 4 onglets :

- **Mes applications** — créer/éditer/supprimer une app, génère `client_id` + affiche `client_secret` **une seule fois**
- **Apps connectées** — apps tierces autorisées, scopes accordés, dernière utilisation, bouton **Révoquer**
- **Documentation** — page React statique : intro, flow OAuth illustré, table complète des endpoints, scopes, exemples cURL/JS/Python, codes d'erreur, lien vers `/v1/openapi.json`
- **Logs** — 100 derniers appels API de mes apps (endpoint, status, durée)

Page **`/oauth/consent`** dédiée, design Apple Liquid Glass cohérent.

## 10. Sécurité — points critiques

- Tokens et `client_secret` stockés **hashés SHA-256** — jamais récupérables
- **PKCE S256 obligatoire** même pour clients confidentiels
- Codes d'autorisation : usage unique, TTL 5 min
- Refresh tokens : rotation auto, ancien invalidé
- Validation stricte `redirect_uri` (match exact, pas de wildcard)
- Logs d'audit sur création/révocation d'app et token
- Vérification des scopes à chaque appel
- Pas de scope `admin:*` — l'API ne donne jamais accès aux fonctions admin
- Endpoints d'écriture : validation Zod stricte sur tous les champs
- L'écriture impossible sur tables sensibles (`ai_credits`, `daily_usage`, `achievements`)

## 11. Ce que ça te permet (ton cas perso)

1. Tu enregistres ton app d'analyse santé sur `/developers` (tu obtiens client_id/secret)
2. Tu autorises ton app sur tes propres données avec tous les scopes voulus
3. Ton app croise `GET /v1/habits`, `/v1/focus-sessions`, `/v1/journal`, `/v1/reflections`, `/v1/productivity-score`, `/v1/analytics/*` avec HealthKit/Strava/etc.
4. Tu peux aussi **écrire** : créer une tâche depuis Siri, marquer une habitude depuis ton Apple Watch, etc.

## 12. Hors-scope v1

- Webhooks (notifications événements) → v2
- SDKs officiels JS/Python → v2
- Endpoints IA générative (chat, analyse à la volée) — risque de drain de crédits, à concevoir séparément
- Sous-domaine `api.deepflow.app` (DNS dédié)
- Badge "app vérifiée" pour apps tierces publiques

## Récap technique

- **6 nouvelles tables** + RLS strictes
- **4 nouvelles edge functions**
- **2 nouvelles pages** (`/developers` 4 onglets + `/oauth/consent`)
- **~15 ressources** exposées en CRUD complet
- **~17 scopes** granulaires
- **1 migration** pour tables, indexes, RLS et triggers de hash/rotation
