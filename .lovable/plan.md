

# Audit & Plan d'Améliorations — DeepFlow (10 points)

Après analyse complète du code, de la sécurité, de l'UX et de la conformité légale, voici les 10 améliorations classées par criticité.

---

## 1. SECURITE — Admin protégé uniquement côté client (CRITIQUE)

**Problème** : `Admin.tsx` copie simplement `clientIsAdmin` sans jamais appeler la Edge Function `verify-admin`. Un utilisateur manipulant le state client pourrait accéder aux actions admin.

**Correction** :
- Appeler `supabase.functions.invoke('verify-admin')` au chargement de la page Admin
- Utiliser la réponse serveur pour gater l'accès, pas le state client
- Ajouter des RLS policies strictes sur toutes les tables sensibles (bannissements, crédits, abonnements) pour que seuls les admins puissent écrire

---

## 2. SECURITE — Edge Functions exposent des détails d'erreur internes

**Problème** : `validate-purchase` retourne `error.message` et `error.toString()` dans les réponses 500, exposant potentiellement des noms de tables et des stack traces.

**Correction** :
- Retourner des messages d'erreur génériques au client
- Logger le détail serveur-side uniquement via `console.error`
- Appliquer le même pattern à toutes les Edge Functions

---

## 3. LEGAL/RGPD — Absence de bandeau de consentement cookies et de suppression de compte

**Problème** : 
- Aucun bandeau de consentement cookies n'existe malgré l'utilisation de localStorage et de tracking
- La politique de confidentialité mentionne le droit de suppression (RGPD Art.17) mais aucune fonctionnalité ne permet réellement de supprimer son compte
- Les CGU disent "Vous pouvez supprimer votre compte depuis les paramètres" mais ce bouton n'existe pas

**Correction** :
- Créer un composant `CookieConsent` affiché au premier lancement
- Ajouter un bouton "Supprimer mon compte" dans Settings qui appelle une Edge Function dédiée (suppression cascade de toutes les données utilisateur)
- Ajouter un export de données (RGPD portabilité)

---

## 4. MOBILE/PWA — Landing page et pages auth non optimisées pour petit écran

**Problème** : 
- La landing page (`Index.tsx`) a des titres en `text-5xl md:text-7xl` qui débordent sur petits écrans (< 375px)
- Les statistiques "social proof" (+2,847 / 87% / 4.2h) ne sont pas des données réelles, potentiellement trompeur
- Le footer CTA a un bouton avec `py-7` excessif sur mobile

**Correction** :
- Ajuster la typographie hero pour les petits écrans (`text-3xl sm:text-5xl md:text-7xl`)
- Réduire le padding du CTA footer
- Ajouter `safe-area-inset` pour les iPhones avec encoche

---

## 5. CODE — Appel à une Edge Function inexistante (`check-subscription`)

**Problème** : `billing.ts` appelle `supabase.functions.invoke('check-subscription')` mais cette fonction n'existe pas dans le projet. Si elle est appelée, elle provoquera une erreur silencieuse.

**Correction** :
- Soit créer la Edge Function `check-subscription`
- Soit remplacer par une requête directe à la table `subscribers` (déjà fait dans `useSubscription.ts` — donc supprimer `checkSubscriptionStatus` de `billing.ts`)
- Nettoyer aussi `validateInAppPurchase` qui appelle `validate-purchase` (déprécié/410)

---

## 6. UX — Absence de feedback d'erreur global et d'état vide cohérent

**Problème** :
- Pas de Error Boundary React : une erreur dans un composant crash toute l'app
- Les pages ne gèrent pas toujours l'état "vide" de manière engageante (certaines affichent juste rien)

**Correction** :
- Ajouter un `ErrorBoundary` global dans `App.tsx` avec une page d'erreur conviviale (avec le pingouin)
- Uniformiser les empty states avec `PagePenguinEmpty` sur toutes les pages (Tasks, Habits, Goals, Journal, Focus)

---

## 7. PERFORMANCE — QueryClient sans configuration optimale

**Problème** : `QueryClient` est instancié sans configuration dans `App.tsx` (ligne 38). Pas de `staleTime`, `gcTime`, ou `retry` par défaut. Chaque navigation re-fetch toutes les données.

**Correction** :
- Configurer des defaults raisonnables :
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 8. SECURITE — Auth flow en mode `implicit` (obsolète)

**Problème** : Le client Supabase utilise `flowType: 'implicit'` dans `client.ts`. Le flow implicite expose le token dans l'URL fragment, et est considéré obsolète (RFC 6749 Section 10.16).

**Correction** :
- Migrer vers `flowType: 'pkce'` qui est plus sécurisé
- Ajuster les redirections post-auth en conséquence

---

## 9. UX/INTERFACE — Page Paramètres manque d'option de suppression de compte et d'export

**Problème** : En plus du problème RGPD (point 3), la page Settings n'offre pas :
- D'option pour changer de mot de passe depuis l'app
- D'option d'export des données personnelles
- La section "Crédits IA" affiche un max hardcodé de 200 qui ne correspond à rien de réel

**Correction** :
- Ajouter un bouton "Changer le mot de passe" qui utilise `supabase.auth.updateUser`
- Ajouter un bouton "Exporter mes données" (Edge Function qui compile un JSON)
- Calculer le max de crédits dynamiquement selon le tier d'abonnement

---

## 10. LEGAL — Pages légales obsolètes (date janvier 2025) et informations incomplètes

**Problème** :
- Les pages Privacy et Terms affichent "Dernière mise à jour : Janvier 2025" — obsolète
- Aucune mention du DPO ou responsable de traitement
- Pas de mention de Stripe (nouveau processeur de paiement) dans la politique de confidentialité
- Cookie policy ne mentionne pas les cookies techniques utilisés (localStorage `deepflow-auth-session`, `deepflow_remember_me`, etc.)

**Correction** :
- Mettre à jour la date à Mars 2026
- Ajouter la mention de Stripe comme sous-traitant de paiement
- Lister les cookies/localStorage techniques dans la page Cookies
- Ajouter les coordonnées du responsable de traitement

---

## Ordre de priorité recommandé

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|-----------|
| 1 | Admin server-side verification | Sécurité critique | Facile |
| 2 | Error details masquées dans Edge Functions | Sécurité | Facile |
| 3 | Consentement cookies + suppression compte | Légal/RGPD | Moyen |
| 5 | Nettoyage billing.ts (fonctions mortes) | Stabilité | Facile |
| 8 | Migration auth PKCE | Sécurité | Moyen |
| 7 | QueryClient optimisé | Performance | Facile |
| 6 | Error Boundary + empty states | UX | Moyen |
| 4 | Responsive mobile fine-tuning | UX | Moyen |
| 9 | Settings enrichi (password, export) | UX/RGPD | Moyen |
| 10 | Pages légales mises à jour | Légal | Facile |

