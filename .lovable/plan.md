

# Plan: Correction de tous les problemes fonctionnels identifies

## Problemes trouves

### P1 — Streaks incohérents entre Dashboard et Analyse
- **Dashboard** calcule un `productivityScore` avec `streakCount * 10` plafonné à 100 (donc streak 10 = max)
- **Analysis** calcule `habitScore = streakCount * 10` de la meme facon, MAIS `focusScore = (totalFocusTime / 60) * 10` — donc 6h de focus = 100%. Formule incoherente.
- **Le score du Dashboard et celui d'Analysis sont calcules differemment** : Dashboard pondère (40% tâches, 30% focus, 20% streak, 10% habitudes) tandis qu'Analysis fait une moyenne simple de 3 métriques. Résultat : deux scores différents affichés dans la meme app.
- **Fix** : Unifier la formule dans un hook unique `useProductivityScore` et l'utiliser partout.

### P2 — Tendance hebdomadaire (Analysis) utilise `Math.random()`
- Ligne 53 : `tasks: Math.round(Math.random() * 5 + ...)` — les données du graphique "Tendance Hebdomadaire" sont aléatoires, jamais basées sur les vraies données.
- **Fix** : Calculer à partir des tâches et habitudes réelles par jour de la semaine.

### P3 — Habitudes : navigation par date corrompt l'état
- `toggleHabitCompletion` fait un optimistic update sur `habits` state mais ne stocke pas la date consultée. Si l'utilisateur navigue vers un autre jour, coche une habitude, puis revient à aujourd'hui, le state local `is_completed_today` est désynchronisé car `fetchHabits` n'est pas rappelé systématiquement avec la bonne date.
- Le vrai bug : `fetchHabits` recalcule les streaks à chaque appel (lignes 149-173), ce qui fait N+1 requêtes par habitude. Quand on revient à aujourd'hui, les streaks recalculés peuvent différer.
- **Fix** : Séparer la logique de streak repair du fetch. Ne recalculer les streaks que quand on modifie une completion, pas à chaque navigation.

### P4 — Calendrier : interface minimaliste, pas d'events locaux visibles clairement
- Le calendrier ne montre les items locaux (taches, objectifs) que si Google Calendar est connecté. Sans Google connecté, on voit juste "Connectez votre calendrier" — l'utilisateur ne peut pas voir ses tâches/objectifs dans un calendrier.
- Les events locaux n'ont pas d'heure précise (défaut 9h-10h) — pas utile.
- Le bouton "+" FAB chevauche la barre de navigation mobile.
- **Fix** : Afficher le calendrier même sans Google (avec seulement les items locaux), améliorer le positionnement FAB, et montrer un mini-calendrier mensuel.

### P5 — Reflexion : pas de modification/suppression possible
- L'historique des réflexions est en lecture seule. Pas de bouton modifier ni supprimer.
- **Fix** : Ajouter boutons edit/delete sur chaque reflexion dans l'historique.

### P6 — Intelligence IA : onglet Analysis embarque toute la page Analysis (avec son propre calcul de score)
- `AIAssistant.tsx` importe `Analysis` et `Profile` en entier comme sous-pages. Cela cause :
  - Double rendu des charts (les warnings recharts `width(0) height(0)` dans les logs)
  - Le score dans l'onglet Analyse IA est celui de `Analysis.tsx` qui diffère du Dashboard
- **Fix** : Ne pas embarquer les pages entières. Créer des composants légers dédiés pour l'onglet Analyse dans l'IA.

### P7 — Stripe webhook manque le secret STRIPE_WEBHOOK_SECRET
- Le webhook existe mais ne peut pas fonctionner sans le secret. Il faut vérifier sa présence et alerter l'utilisateur.

### P8 — Charts recharts : warnings width/height 0
- Les charts dans les onglets cachés (via `hidden` class) ont une taille 0 au montage, causant les warnings en console.
- **Fix** : Ne rendre les charts que quand l'onglet est visible, ou utiliser un lazy mount.

## Plan d'implementation

### 1. Unifier le score de productivité
- Créer `src/hooks/useProductivityScore.ts` avec une formule unique
- L'utiliser dans `Dashboard.tsx` et `Analysis.tsx`
- Supprimer les calculs dupliqués

### 2. Fix données aléatoires dans Analysis
- Remplacer `Math.random()` dans `weeklyTrend` par des vraies données groupées par jour de la semaine depuis les tâches et habitudes

### 3. Fix navigation habitudes
- Arrêter de recalculer les streaks dans `fetchHabits` (supprimer lignes 149-173)
- Ne recalculer que dans `toggleHabitCompletion` (déjà fait) et dans `repairHabitsStreaks` (au chargement initial uniquement)

### 4. Calendrier visible sans Google
- Séparer la condition : afficher `AppleCalendarView` même quand `!isConnected`, mais sans les events Google
- Ajouter un bandeau discret "Connecter Google" au lieu du fullscreen blocker
- Corriger le FAB position sur mobile (`bottom-24` au lieu de `bottom-20`)

### 5. Reflexion : edit et delete
- Ajouter des boutons edit/delete sur chaque card dans l'historique
- Permettre la modification inline (dialog ou expansion)
- Appeler `supabase.from('daily_reflections').delete/update`

### 6. Fix IA page — ne pas embarquer Analysis/Profile entiers
- Remplacer `<Analysis />` par un composant leger `AIAnalysisSummary` qui affiche juste le score + radar
- Remplacer `<Profile />` par un composant leger ou le garder mais en lazy-mount
- Condition de rendu : ne monter le composant que quand l'onglet est actif (pas `hidden` CSS)

### 7. Fix recharts warnings
- Utiliser rendu conditionnel (`activeTab === "analysis" && <Analysis />`) au lieu de `hidden` class pour les onglets avec charts

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| **Nouveau** `src/hooks/useProductivityScore.ts` | Formule unifiée |
| `src/pages/Dashboard.tsx` | Utiliser le hook unifié |
| `src/pages/Analysis.tsx` | Utiliser le hook unifié + fix `Math.random()` + fix weekly trend |
| `src/pages/Habits.tsx` | Supprimer streak recalcul dans fetchHabits |
| `src/pages/Calendar.tsx` | Afficher calendrier sans Google connecté |
| `src/components/AppleCalendarView.tsx` | Fix FAB position mobile |
| `src/pages/Reflection.tsx` | Ajouter edit/delete |
| `src/pages/AIAssistant.tsx` | Lazy-mount onglets au lieu de hidden, composants légers |

