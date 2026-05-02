# Audit & corrections — DeepFlow

J'ai parcouru les pages, hooks et logs. Voici les vrais problèmes trouvés (pas de réécriture inutile) et ce que je propose de corriger.

## 1. Bugs concrets à corriger

### a. Erreur React dans la liste des tâches (visible dans la console)
`SortableTaskCard` est utilisé dans `<AnimatePresence mode="popLayout">`, qui passe une `ref` au composant enfant. Or le composant n'utilise pas `forwardRef`. Console actuelle :
> Function components cannot be given refs… Check the render method of `PopChild`.
**Fix** : envelopper `SortableTaskCard` dans `React.forwardRef` et transmettre la `ref` au `<div>` racine.

### b. Boucle de fetch des sous-tâches
`src/pages/Tasks.tsx` :
```ts
useEffect(() => { fetchSubtasks(); }, [user, tasks]);
```
À chaque `refetch()` (toggle complete, edit, delete, reorder…), `tasks` change → re-fetch des sous-tâches même quand inutile.
**Fix** : ne dépendre que des `tasks.map(t=>t.id).join(',')` ou recharger explicitement après les mutations qui touchent vraiment aux sous-tâches.

### c. Race condition sur les crédits IA et le compteur d'usage
`useAICredits.useCredits` et `useSubscription.trackUsage` font `read → compute → write` côté client. Deux clics rapides peuvent décrémenter une seule fois ou compter en double.
**Fix** : créer une fonction Postgres `consume_ai_credit(amount int)` et `increment_daily_usage(type text)` (SECURITY DEFINER, atomique), et les appeler via `supabase.rpc(...)`.

### d. "Analyse IA déjà utilisée" alors que jamais lancée
La limite Basique est `dailyAnalyses = 1`. Si un ancien `useEffect` (corrigé récemment) ou une re-render a tracké 1 usage, le compteur reste en DB. Aucune logique ne le réinitialise hors changement de jour.
**Fix** : ajouter dans Settings/Admin un bouton "Réinitialiser mes compteurs IA du jour" (côté user pour Admin, ou via un RPC qui supprime la ligne `daily_usage` du jour).

### e. Suppression sans confirmation
`Tasks.tsx`, `Goals.tsx` : `handleDelete` supprime directement.
**Fix** : ajouter un `AlertDialog` de confirmation (déjà utilisé dans Habits).

## 2. Cohérence i18n (app entièrement FR)

Plusieurs toasts encore en anglais dans `Tasks.tsx` :
- `"Success" / "Task deleted successfully" / "Task updated successfully" / "Error"`
**Fix** : traduire en FR (cohérent avec le reste).

## 3. Cohérence avec la mémoire projet

### a. `toISOString().split('T')[0]` interdit
Encore présent dans :
- `supabase/functions/calendar-ai-suggestions/index.ts` (lignes 65, 120) — utilisé pour générer une clé de date côté serveur ; à remplacer par une fonction locale équivalente à `toLocalDateKey`.
- `src/pages/Focus.tsx` ligne 615 (max d'un input date) — peu critique mais à harmoniser.
- `src/pages/Settings.tsx` et `Admin.tsx` : usage uniquement pour nommer le fichier d'export → acceptable, on garde.

## 4. Petites améliorations UX

- **Manifest PWA** : ajouter `purpose: "any maskable"` sur l'icône principale et référencer le nouveau `favicon.png` ajouté récemment dans `<link rel="icon">` (déjà fait dans `index.html` apparemment, à revérifier).
- **TaskList — état vide après filtres** : OK déjà géré.
- **Page `Profile` (`canUseFeature("ai_profile")`)** : actuellement bloque silencieusement les Basique. Afficher un bandeau "Disponible avec Premium" plutôt qu'une page vide.
- **AIAssistant — affichage des crédits** : harmoniser le compteur affiché (`aiCredits` vs `getRemainingUses("chat")`) — actuellement deux sources peuvent diverger.

## 5. Hors scope (à ne pas faire maintenant)

- Refactor majeur de pages > 500 lignes (Admin, Focus, Habits, Settings) — fonctionnel, juste long.
- Migration vers React Query pour toutes les pages — gros chantier.
- 100 `console.log` à nettoyer — non bloquant.

## Détails techniques

### Migration SQL prévue
```sql
-- Décrémenter un crédit de façon atomique
CREATE OR REPLACE FUNCTION public.consume_ai_credit(amount int)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE remaining int;
BEGIN
  UPDATE ai_credits
  SET credits = credits - amount, last_updated = now()
  WHERE user_id = auth.uid() AND credits >= amount
  RETURNING credits INTO remaining;
  IF remaining IS NULL THEN RAISE EXCEPTION 'Crédits insuffisants'; END IF;
  RETURN remaining;
END $$;

-- Incrémenter daily_usage atomiquement
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO daily_usage(user_id, usage_date, ai_chat_count, ai_analysis_count)
  VALUES (auth.uid(), (now() AT TIME ZONE 'Europe/Paris')::date,
          CASE WHEN p_type='chat' THEN 1 ELSE 0 END,
          CASE WHEN p_type='analysis' THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, usage_date) DO UPDATE
  SET ai_chat_count = daily_usage.ai_chat_count + EXCLUDED.ai_chat_count,
      ai_analysis_count = daily_usage.ai_analysis_count + EXCLUDED.ai_analysis_count,
      updated_at = now();
END $$;

-- Reset compteurs IA du jour pour soi-même
CREATE OR REPLACE FUNCTION public.reset_my_daily_ai_usage()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM daily_usage
  WHERE user_id = auth.uid()
    AND usage_date = (now() AT TIME ZONE 'Europe/Paris')::date;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_credit(int),
                          public.increment_daily_usage(text),
                          public.reset_my_daily_ai_usage()
FROM anon, public;
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(int),
                         public.increment_daily_usage(text),
                         public.reset_my_daily_ai_usage()
TO authenticated;
```

### Fichiers à modifier
- `src/components/TaskList.tsx` — `forwardRef` sur `SortableTaskCard`
- `src/pages/Tasks.tsx` — dépendances useEffect, toasts FR, AlertDialog suppression
- `src/pages/Goals.tsx` — AlertDialog suppression
- `src/hooks/useAICredits.ts` — utiliser `rpc('consume_ai_credit')`
- `src/hooks/useSubscription.ts` — utiliser `rpc('increment_daily_usage')`, exposer `resetDailyUsage()`
- `src/pages/Settings.tsx` — bouton "Réinitialiser compteurs IA du jour"
- `src/pages/AIAssistant.tsx` — unifier l'affichage crédits/limite
- `src/pages/Profile.tsx` — bandeau Premium au lieu de blocage muet
- `supabase/functions/calendar-ai-suggestions/index.ts` — helper local de date

Ce plan corrige les vrais problèmes visibles (erreur console, race conditions crédits IA, "analyse déjà utilisée", suppression sans confirmation, toasts EN) sans chambouler l'architecture.