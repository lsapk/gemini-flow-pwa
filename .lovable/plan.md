

# Plan: Admin Refonte + Anti-Bot + Finalisation Production

## Vue d'ensemble
Trois axes pour rendre l'app production-ready : protection anti-bot sur l'inscription, refonte admin avec onglet securite et filtres, et corrections finales (toISOString, console.log, rate limit login, routes mortes).

## 1. Anti-Bot sur Register.tsx
- Ajouter un champ **honeypot** invisible (input `website` cache via CSS `position:absolute;left:-9999px`)
- **Timing guard** : stocker `Date.now()` au mount, rejeter silencieusement si soumission < 3 secondes
- Desactiver le bouton 30s apres un echec (anti brute-force basique)

## 2. Rate limit Login.tsx
- Compteur d'echecs consecutifs (`failCount` state)
- Apres 3 echecs : cooldown progressif (10s, 30s, 60s) avec bouton desactive et countdown affiche
- Reset au succes

## 3. Refonte Admin.tsx

**Suppressions :**
- Stat "Credits Admin ∞" — inutile, remplacer par "Entries journal" (count)
- Bouton "Actions Masse" (un seul item) — integrer "Reset compteurs" directement dans Actions Rapides

**Ajouts :**
- **Filtres rapides** sous la barre de recherche : pills Tous / Admins / Bannis / Premium / Nouveaux (7j)
- **Onglet Securite** (3e tab) : comptes crees aujourd'hui, cette semaine, liste des bannis recents
- Icones colorees par type d'action dans les logs (ban=rouge, credits=violet, announce=bleu, purge=orange)
- Date du jour + nom admin dans le header

**useAdminStats.ts :**
- Ajouter `totalJournalEntries` et `totalSubscribers` dans les stats
- Calculer `retentionRate` = `activeUsersToday / totalUsers * 100`

## 4. Corrections finales pour production

**toISOString cleanup (6 fichiers restants) :**
- Remplacer les occurrences restantes par `toLocalDateKey()` dans : `CreateTaskForm.tsx`, `useRealProductivityAnalysis.ts`, `useLifeWheelData.ts`, `useAnalyticsData.tsx`, `Focus.tsx`
- Garder `toISOString` uniquement pour les exports CSV/JSON (noms de fichiers) ou ce n'est pas une date utilisateur

**Console.log cleanup :**
- Supprimer le `console.log` dans `ResetPassword.tsx`
- Le `console.error` dans `NotFound.tsx` est OK (debug 404)

**Routes mortes :**
- `/badges` redirige vers `/gamification` qui n'existe pas — corriger vers `/dashboard`

## Fichiers modifies

| Fichier | Action |
|---------|--------|
| `src/pages/Register.tsx` | Honeypot + timing guard |
| `src/pages/Login.tsx` | Rate limit apres echecs |
| `src/pages/Admin.tsx` | Refonte UI — filtres, onglet securite, nettoyage stats |
| `src/hooks/useAdminStats.ts` | Ajouter journal count, subscribers, retention |
| `src/App.tsx` | Fix route `/badges` → `/dashboard` |
| `src/pages/ResetPassword.tsx` | Supprimer console.log |
| `src/components/modals/CreateTaskForm.tsx` | toLocalDateKey |
| `src/hooks/useRealProductivityAnalysis.ts` | toLocalDateKey |
| `src/hooks/useLifeWheelData.ts` | toLocalDateKey |
| `src/hooks/useAnalyticsData.tsx` | toLocalDateKey |
| `src/pages/Focus.tsx` | toLocalDateKey |

