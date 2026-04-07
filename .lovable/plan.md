

# Plan: Nettoyage Gamification + Simplification + Stripe + IA

## 1. Supprimer toute la gamification pingouin

### Fichiers a modifier

**`src/pages/Settings.tsx`**
- Supprimer `import { penguinMascot }`, `playerProfile` state, `fetchPlayerProfile()`, appel dans useEffect
- Supprimer le bloc "Progression Pingouin" (lignes 452-484) — la card entiere avec crevettes/saumons/poissons
- Supprimer dans le profil : img pingouin, stageLabel, saumons, bouton "Mon Pingouin", bouton "Boutique"
- Supprimer `penguin_profiles` de la liste des tables dans `handleDeleteAllData`
- Supprimer la question FAQ "Comment nourrir mon pingouin"
- Remplacer la description FAQ "gamification" par "productivite augmentee par IA"
- Supprimer imports `Gamepad2, Trophy` inutilises

**`src/pages/Admin.tsx`**
- Supprimer `penguinMascot` import et image dans le header
- Supprimer `penguin_stage`, `shrimp_total`, `salmon_total`, `golden_fish_total` de UserData et de handleViewUser
- Supprimer `handleResetPenguin`, `resetPenguinOpen/User` state, bouton "Reset pingouin" dans la liste users
- Supprimer `STAGE_LABELS`, le bloc pingouin dans le dialog details user (lignes 701-713)
- Supprimer le dialog "Reset Penguin" (lignes 795-807)
- Supprimer `reset_penguin` des LOG_ICONS et getLogBgColor

**`src/pages/Dashboard.tsx`**
- Supprimer `penguinThinking` import + image dans le header
- Changer le quick link "Pingouin" → "Analyse" pointant vers `/ai-assistant`
- Supprimer le commentaire "Gamification Widget"

**`src/pages/Register.tsx`**
- Supprimer `penguinMascot` import et l'image animee du pingouin
- Remplacer par l'icone DeepFlow (le logo existant ou un gradient icon)

**`src/components/layout/Sidebar.tsx`**
- Supprimer import `Gamepad2` (deja inutilise mais present)

**`src/hooks/useSubscription.ts`**
- Supprimer `hasFullGamification` de SubscriptionLimits et TIER_LIMITS
- Supprimer case `"gamification"` dans canUseFeature

**`src/components/PremiumUpgradeCard.tsx`**
- Retirer "Gamification complete" des features Premium
- Retirer le mapping `gamification` dans FeatureLockedOverlay
- Remplacer par "Rapports IA mensuels" ou "Insights avances"

**`src/constants/assets.ts`**
- Supprimer le fichier entier (plus utilise apres nettoyage)

**`src/pages/Badges.tsx`**
- Supprimer le commentaire "Gamification" (ligne 394)

**`src/pages/legal/Terms.tsx`**
- Remplacer "gamification" par "productivite augmentee par IA"

## 2. Simplification du code

- **`src/services/billing.ts`** : le body envoie `{ planType }` mais `create-checkout` attend `{ productId }` — aligner les deux
- **`src/hooks/useSubscription.ts`** : `handleStripeCheckout` envoie toujours `"premium"` que ce soit monthly ou yearly — passer le vrai productId (`"premium_monthly"` ou `"premium_yearly"`) au checkout
- **`src/utils/aiLimits.ts`** : tout le monde est "premium" (`isPremium = true`, `hasReachedLimit = false`) — ce fichier contourne toute la logique. Le simplifier en un one-liner ou le supprimer et utiliser `useSubscription` partout
- **`src/pages/Badges.tsx`** : `dateToLocalKey` est duplique — importer depuis `src/utils/dateUtils.ts`

## 3. Integration Stripe correcte et securisee

**`src/services/billing.ts`** — Refactorer pour envoyer le bon `productId` :
```ts
export const createCheckoutSession = async (
  productId: 'premium_monthly' | 'premium_yearly' | 'premium_lifetime'
) => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { productId }
  });
  // ...
};
```

**`src/hooks/useSubscription.ts`** — Fix `handleStripeCheckout` :
```ts
const handleStripeCheckout = async (plan: "premium_monthly" | "premium_yearly") => {
  const { url, error } = await createCheckoutSession(plan);
  // ...
};
```

**`supabase/functions/create-checkout/index.ts`** — Deja corrige pour lire les env vars. Ajouter une validation Zod du body pour rejeter les inputs invalides.

**Ajouter un webhook Stripe** (`stripe-webhook` edge function) :
- Ecoute `checkout.session.completed` et `customer.subscription.deleted`
- Met a jour la table `subscribers` automatiquement (subscribed, tier, end date)
- Sans webhook, le statut d'abonnement n'est jamais mis a jour apres paiement — c'est un bug critique
- Necessite un secret `STRIPE_WEBHOOK_SECRET`

## 4. Nouvelles integrations IA

**A. Reflexion IA dans la page Reflection** (`src/pages/Reflection.tsx`)
- Apres avoir repondu a une question de reflexion, bouton "✨ Insight IA"
- Envoie la question + reponse a `gemini-chat-enhanced` pour un retour empathique personnalise
- Affiche la reponse IA sous la reflexion de l'utilisateur

**B. Resume IA dans le Journal** (`src/pages/Journal.tsx`)
- Bouton "✨ Resume de la semaine" en haut de la page
- Appelle une nouvelle edge function `journal-weekly-summary` qui prend les entries des 7 derniers jours
- Retourne un resume structure : humeur dominante, themes recurrents, recommandations
- Affiche dans un composant card collapsible

**C. Smart Focus Suggestions** (`src/pages/Focus.tsx`)
- Avant de lancer une session focus, bouton "✨ Que bosser maintenant ?"
- Appelle `gemini-chat-enhanced` avec la liste des taches en cours (triees par priorite/deadline)
- Retourne la tache la plus urgente avec une justification
- Pre-remplit le label de la session focus

## Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/pages/Settings.tsx` | Purger gamification pingouin |
| `src/pages/Admin.tsx` | Purger pingouin (reset, dialog, stats, logs) |
| `src/pages/Dashboard.tsx` | Retirer mascotte, fix quick links |
| `src/pages/Register.tsx` | Retirer mascotte pingouin |
| `src/components/PremiumUpgradeCard.tsx` | Retirer "gamification" des features |
| `src/hooks/useSubscription.ts` | Retirer gamification, fix checkout |
| `src/services/billing.ts` | Aligner productId |
| `src/constants/assets.ts` | Supprimer |
| `src/utils/aiLimits.ts` | Simplifier |
| `src/pages/Badges.tsx` | Importer dateUtils, retirer duplicat |
| `src/pages/legal/Terms.tsx` | Texte |
| `src/components/layout/Sidebar.tsx` | Retirer Gamepad2 |
| `supabase/functions/create-checkout/index.ts` | Validation Zod |
| **Nouveau** `supabase/functions/stripe-webhook/index.ts` | Webhook Stripe |
| **Nouveau** `supabase/functions/journal-weekly-summary/index.ts` | Resume journal IA |
| `src/pages/Reflection.tsx` | Bouton Insight IA |
| `src/pages/Journal.tsx` | Bouton resume semaine IA |
| `src/pages/Focus.tsx` | Suggestion IA pre-session |

