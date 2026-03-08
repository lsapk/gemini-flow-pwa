# Plan: Assistant IA ✨ pour Tâches, Habitudes et Objectifs

## Concept

Ajouter un bouton **✨** dans les formulaires de création/édition de tâches, habitudes et objectifs. Un clic envoie le titre au backend, qui renvoie une description enrichie, une priorité/catégorie suggérée, et des sous-tâches/conseils. L'utilisateur voit les champs se remplir automatiquement avec une animation skeleton.

## Architecture

- **Nouvelle edge function** `ai-item-assistant` : reçoit `{ type: "task"|"habit"|"goal", title, existingData? }`, renvoie des suggestions structurées via tool calling (pas de JSON dans le prompt)
- **Nouveau hook** `useAIItemAssistant.ts` : appelle la function, gère loading/error
- **Boutons ✨** dans les 3 formulaires existants

## Edge Function `ai-item-assistant`

Utilise `gemini-chat-enhanced` pattern existant (auth, credits check, clé api de gemini comme les autres fonctionnalités ia). Prompt adapté selon le type :

- **Task** → retourne `{ description, priority, due_date_suggestion, subtasks[] }`
- **Habit** → retourne `{ description, frequency, category, tips }` 
- **Goal** → retourne `{ description, category, milestones[] }`

Utilise le tool calling pour extraire du JSON structuré proprement.

## Hook `useAIItemAssistant`

```text
const { suggest, isLoading, suggestion } = useAIItemAssistant();
await suggest({ type: "task", title: "Préparer présentation Q3" });
// suggestion = { description: "...", priority: "high", subtasks: [...] }
```

## Modifications des formulaires

### `CreateTaskForm.tsx`

- Bouton ✨ à côté du label "Description" → appelle `suggest({ type: "task", title })`
- Remplit automatiquement : description, priority, due_date
- Animation shimmer pendant le chargement

### `CreateHabitForm.tsx`

- Bouton ✨ à côté du label "Description" → appelle `suggest({ type: "habit", title })`
- Remplit : description, frequency, category

### `CreateGoalForm.tsx`

- Bouton ✨ à côté du label "Description" → appelle `suggest({ type: "goal", title })`
- Remplit : description, category

## Fichiers


| Fichier                                         | Action                                        |
| ----------------------------------------------- | --------------------------------------------- |
| `supabase/functions/ai-item-assistant/index.ts` | **Nouveau** — Edge function avec tool calling |
| `supabase/config.toml`                          | Ajouter `[functions.ai-item-assistant]`       |
| `src/hooks/useAIItemAssistant.ts`               | **Nouveau** — Hook client                     |
| `src/components/modals/CreateTaskForm.tsx`      | Ajouter bouton ✨ + auto-fill                  |
| `src/components/modals/CreateHabitForm.tsx`     | Ajouter bouton ✨ + auto-fill                  |
| `src/components/modals/CreateGoalForm.tsx`      | Ajouter bouton ✨ + auto-fill                  |
