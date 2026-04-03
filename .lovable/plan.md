

# Plan: Améliorations Code, Sécurité et Fonctionnalités DeepFlow

## Audit rapide — Problèmes identifiés

### SÉCURITÉ (priorité haute)

**S1 — Tokens OAuth stockés en clair**
- `encrypt_token()` dans la migration SQL renvoie le token tel quel (`encrypted_token := token`)
- Impact : si la base est compromise, tous les tokens Google sont lisibles
- Fix : utiliser `pgcrypto` avec `pgp_sym_encrypt` + clé secrète en variable d'environnement

**S2 — Redirect URI OAuth dérivée de `Origin`**
- `google-calendar-oauth` : `REDIRECT_URI = req.headers.get('origin') + '/calendar'`
- Un attaquant peut forger l'Origin pour rediriger vers un domaine malveillant
- Fix : utiliser une allowlist de domaines autorisés (production + preview)

**S3 — `send-contact` sans rate limiting**
- `Access-Control-Allow-Origin: *`, pas d'auth, pas de captcha
- Risque de spam massif et coûts
- Fix : ajouter un rate limit par IP (stocké en mémoire ou via compteur Supabase) + honeypot field

**S4 — Incohérence mot de passe**
- Inscription exige 8+ caractères avec maj/min/chiffre (`Register.tsx`)
- Changement de mot de passe dans Settings accepte 6 caractères minimum
- Fix : aligner sur les mêmes règles (8+ avec complexité)

### BUGS FONCTIONNELS

**B1 — Stripe checkout avec price IDs placeholder**
- `create-checkout` utilise `"price_monthly"`, `"price_yearly"`, `"price_lifetime"` — ce ne sont pas de vrais IDs Stripe
- Fix : les lire depuis des variables d'environnement (`STRIPE_PRICE_MONTHLY`, etc.)

**B2 — Dates timezone-unsafe avec `toISOString().split('T')[0]`**
- 48 occurrences dans le code — peut décaler d'un jour selon le fuseau de l'utilisateur
- Exemple : à 23h en UTC+2, `toISOString()` donne le jour suivant en UTC
- Fix : créer un helper `toLocalDateKey(date)` et remplacer toutes les occurrences

**B3 — `gemini-chat` ignore l'historique (déjà noté dans l'audit)**
- Le body reçoit `chatHistory` mais seul le message courant est envoyé au modèle
- Fix : inclure les N derniers messages comme dans `gemini-chat-enhanced`

### AMÉLIORATIONS DE CODE

**C1 — Bundle trop lourd (chunks > 500kB)**
- Lazy-loader les pages lourdes (Analysis, AIAssistant, Journal) avec `React.lazy` + `Suspense`
- Splitter la dépendance Markdown en chunk séparé

**C2 — Code mort : `validate-purchase`**
- Retourne systématiquement `410 Gone`, plus référencé nulle part côté client
- Supprimer la fonction

**C3 — `penguinMascot` / `penguinThinking` définis en dur dans 5+ fichiers**
- Centraliser dans un fichier `src/constants/assets.ts`

### AMÉLIORATIONS FONCTIONNELLES

**F1 — Notifications push navigateur**
- Rappels pour les habitudes quotidiennes et les tâches à échéance
- Utiliser l'API Notification du navigateur avec permission utilisateur + toggle dans Settings

**F2 — Export PDF du rapport mensuel IA**
- Le composant `MonthlyAIReport` génère du texte mais pas d'export
- Ajouter un bouton "Télécharger PDF" utilisant `html2canvas` + `jspdf`

**F3 — Mode hors-ligne amélioré**
- Le service worker cache les pages mais les données ne sont pas disponibles offline
- Stocker les données critiques (tâches du jour, habitudes) dans IndexedDB pour consultation offline

**F4 — Raccourcis clavier affichés**
- `useKeyboardShortcuts` existe mais pas de modale "?" pour lister les raccourcis disponibles
- Ajouter une modale d'aide accessible via "?" ou un bouton dans le footer

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/google-calendar-oauth/index.ts` | Allowlist pour redirect URI |
| `supabase/functions/send-contact/index.ts` | Rate limit + honeypot |
| `supabase/functions/create-checkout/index.ts` | Env vars pour price IDs |
| `supabase/functions/gemini-chat/index.ts` | Inclure chatHistory dans les messages |
| `supabase/functions/validate-purchase/index.ts` | Supprimer |
| `src/pages/Settings.tsx` | Aligner validation mot de passe (8+ complexe) |
| `src/constants/assets.ts` | **Nouveau** — Centraliser URLs assets |
| `src/utils/dateUtils.ts` | **Nouveau** — Helper `toLocalDateKey()` |
| `src/App.tsx` | Lazy-load pages lourdes |
| Migration SQL | `encrypt_token` avec pgcrypto |
| Pages utilisant `toISOString().split` | Remplacer par `toLocalDateKey` |
| Pages utilisant `penguinMascot` | Importer depuis constants |

## Priorité d'implémentation

1. Sécurité (S1-S4) — critique
2. Bugs fonctionnels (B1-B3) — bloquants en prod
3. Code quality (C1-C3) — maintenabilité
4. Fonctionnalités (F1-F4) — valeur ajoutée

