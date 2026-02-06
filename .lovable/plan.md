
# Plan de Correction : Sous-taches, Transitions, Navigation, Credits

## Problemes Identifies

### 1. Sous-taches ne s'affichent plus
**Cause racine :** Dans `ItemCard.tsx` (ligne 245), les `children` (qui contiennent les sous-taches) ne sont rendus QUE si `variant === 'expanded'`. Mais dans `TaskList.tsx`, la variante est definie ainsi :
```
variant={isExpanded ? 'expanded' : 'standard'}
```
Le probleme est que `isExpanded` est base sur un `Set<string>` local qui commence vide. Quand une tache a des sous-taches, le contenu passe en `expanded` mais les sous-taches elles-memes sont les `children` de `ItemCard` -- or le toggle d'expansion est DANS les children, donc il n'est jamais visible pour cliquer dessus.

En effet dans `SortableTaskCard` (TaskList.tsx lignes 88-151), tout le bloc sous-taches (toggle + liste) est passe en `children` de `ItemCard`. Mais `ItemCard` ne rend les children que quand `variant === 'expanded'` (ligne 245). Le bouton pour passer en mode expanded est LUI-MEME dans les children. C'est un cercle vicieux : on ne peut pas cliquer sur "voir les sous-taches" car le bouton est cache dans un bloc qui requiert d'etre deja expanded.

**Solution :** Modifier `ItemCard.tsx` pour toujours rendre les children quand ils existent (pas seulement en mode `expanded`). Le variant `expanded` controlera juste le style additionnel, pas la visibilite des children.

### 2. Bugs de transition
**Cause racine :** Les `motion.div` avec `layout` et `AnimatePresence mode="popLayout"` dans les listes provoquent des glitches visuels lors des mises a jour optimistes (changement d'etat rapide). Aussi dans `GoalList.tsx`, `handleProgressIncrement` et `updateGoalStatus` utilisent `window.location.reload()` (lignes 83 et 196) ce qui cause un refresh complet au lieu d'une mise a jour fluide.

**Solution :**
- Retirer `window.location.reload()` dans `GoalList.tsx` et utiliser un callback `onRefresh` a la place
- Ajouter une prop `onRefresh` dans `GoalList` pour rafraichir les donnees sans recharger la page
- Simplifier les animations `AnimatePresence` pour eviter les conflits

### 3. Navigation sidebar rafraichit la page
**Cause racine :** La sidebar utilise `navigate(path)` de React Router, ce qui est correct et ne devrait PAS causer de refresh. Le probleme vient probablement de la page `Gamification.tsx` qui a sa propre `AppLayout` dans la page au lieu d'utiliser celle de `App.tsx`. En effet dans `App.tsx` ligne 165-168, la route `/gamification` n'est PAS wrappee dans `<AppLayout>` comme les autres routes -- elle gere son propre layout. Quand on navigue vers/depuis `/gamification`, le composant `AppLayout` est monte/demonte, ce qui donne l'impression d'un refresh.

De plus, les hooks dans Gamification (comme `useQuestProgressTracking`, `useEnsurePlayerProfile`) se re-executent a chaque montage, causant des chargements visibles.

**Solution :**
- Standardiser la route `/gamification` dans `App.tsx` pour utiliser `<AppLayout>` comme toutes les autres routes
- Retirer le `<AppLayout>` interne de `Gamification.tsx`
- S'assurer que tous les hooks utilisent le cache React Query pour eviter les re-fetches inutiles

### 4. Admin : credits de jeu illimites
**Cause racine :** Dans `usePlayerProfile.ts` (ligne 106-108), les admins ont deja `credits: Infinity`. Mais dans `EnhancedShop.tsx` (ligne 104), le check `canAfford` utilise `(profile?.credits || 0) >= powerup.cost`, et `Infinity >= n` est toujours `true`. Cependant dans `usePowerUps.ts` (ligne 236-238), la mutation `activatePowerUp` charge le profil directement depuis la DB (pas via le hook), donc la valeur reelle des credits est utilisee, pas la valeur `Infinity` du hook.

**Solution :**
- Modifier `usePowerUps.ts` pour verifier si l'utilisateur est admin AVANT de deduire les credits
- Si admin, sauter la verification de credits et la deduction

### 5. Credits IA non fonctionnels
**Causes multiples :**
- Le hook `useAICredits` existe et fonctionne techniquement
- Le systeme de credits dans l'edge function `gemini-chat-enhanced` est en place (lignes 83-133)
- MAIS le probleme est que les credits IA ne sont pas DONNES aux nouveaux utilisateurs (pas de credits de depart)
- La boutique (`usePowerUps.ts`) peut donner des credits IA via les packs, mais ils sont achetes avec des credits de jeu
- Il n'y a pas de moyen visible pour l'utilisateur de VOIR ses credits IA en dehors de la Cyber Arena

**Solution :**
- Ajouter des credits IA de depart (ex: 50) lors de la creation du profil joueur
- Afficher les credits IA restants dans le header de l'assistant IA (`AIAssistant.tsx`)
- S'assurer que le systeme de deduction fonctionne correctement
- Ajouter l'affichage des credits IA dans les parametres ou le profil

---

## Modifications par Fichier

### 1. `src/components/shared/ItemCard.tsx`
- Changer la condition de rendu des children : toujours les afficher s'ils existent, pas seulement en mode `expanded`
- Le mode `expanded` ajoute juste un separateur visuel

### 2. `src/components/GoalList.tsx`
- Remplacer les 2 appels `window.location.reload()` par un callback `onRefresh`
- Ajouter la prop `onRefresh` au composant
- Mettre a jour `handleProgressIncrement` pour utiliser le refresh propre

### 3. `src/pages/Goals.tsx`
- Passer la prop `onRefresh` a `GoalList`

### 4. `src/App.tsx`
- Wrapper la route `/gamification` dans `<AppLayout>` comme les autres routes

### 5. `src/pages/Gamification.tsx`
- Retirer le wrapper `<AppLayout>` interne
- Garder le layout interne (hero, tabs, etc.)

### 6. `src/hooks/usePowerUps.ts`
- Ajouter le check `isAdmin` depuis `useAuth()`
- Si admin, sauter la verification de credits et la deduction dans `activatePowerUp`

### 7. `src/pages/AIAssistant.tsx`
- Importer et utiliser `useAICredits`
- Afficher le compteur de credits IA dans le header du chat
- Afficher un avertissement quand les credits sont bas

### 8. `src/hooks/useEnsurePlayerProfile.ts`
- Ajouter la creation d'un enregistrement `ai_credits` initial (50 credits) lors de la creation du profil joueur

---

## Ordre d'Implementation

| Etape | Modification | Impact |
|-------|-------------|--------|
| 1 | Fix ItemCard.tsx children rendering | Sous-taches visibles |
| 2 | Fix GoalList.tsx window.reload | Transitions fluides |
| 3 | Standardiser route Gamification dans App.tsx | Navigation sans refresh |
| 4 | Fix usePowerUps.ts pour admin | Credits jeu illimites admin |
| 5 | Afficher credits IA dans AIAssistant | Visibilite credits IA |
| 6 | Credits IA de depart dans useEnsurePlayerProfile | Credits IA fonctionnels |

---

## Details Techniques Importants

**Sous-taches (ItemCard):** Le changement est minimal -- une seule ligne a modifier. Au lieu de `{variant === 'expanded' && children && (...)}`, on utilise `{children && (...)}`. Cela rend les children visibles quelle que soit la variante, ce qui permet au bouton toggle des sous-taches d'etre visible.

**Navigation:** Le vrai probleme n'est pas `navigate()` mais le montage/demontage de `AppLayout`. Quand on va sur `/gamification` depuis `/dashboard`, `AppLayout` est demonte puis remonte dans `Gamification.tsx`, causant un flash visuel. En uniformisant le layout, la sidebar et le header restent stables.

**Credits Admin:** Dans `usePowerUps.ts`, on ajoute `const { isAdmin } = useAuth()` et dans la mutation, on fait:
```typescript
if (!isAdmin) {
  // Verifier et deduire les credits
}
// Continuer avec l'achat
```

**Credits IA de depart:** Dans `useEnsurePlayerProfile.ts`, apres creation du player_profile, on ajoute aussi un insert dans `ai_credits` avec 50 credits initiaux.
