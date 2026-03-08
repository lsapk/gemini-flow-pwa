

# Plan: Refonte complète du calendrier Apple-style + Illustrations pingouin

## 1. Refonte du Calendrier (from scratch)

Le calendrier actuel est composé de 5 fichiers redondants et incohérents (`GoogleCalendarView`, `ProfessionalWeekCalendar`, `WeekCalendarView`, `CalendarDayView`, `GoogleCalendarHeader`). On simplifie en 2 composants propres + 1 page.

### Architecture cible

- **`Calendar.tsx` (page)** : Logique de connexion Google + state management. Interface unifiée sans duplication.
- **`AppleCalendarView.tsx` (nouveau)** : Composant unique pour vue semaine/jour avec grille horaire, current-time indicator, events positionnés absolument. Remplace `GoogleCalendarView` + `ProfessionalWeekCalendar` + `WeekCalendarView`.
- **`GoogleCalendarEventModal.tsx`** : Nettoyé avec style Apple cohérent (inputs filled, rounded-2xl).
- **Supprimer** : `GoogleCalendarHeader.tsx` (intégré dans AppleCalendarView), `CalendarDayView.tsx`, `WeekCalendarView.tsx`, `ProfessionalWeekCalendar.tsx`.

### Design Apple du calendrier

- **Header** : Barre compacte avec mois/année en gros (SF, -0.025em), flèches gauche/droite, bouton "Aujourd'hui" pill, toggle Jour/Semaine sous forme de segmented control (comme iOS Calendar).
- **Grille semaine** : 
  - Colonne heures à gauche (texte 11px, muted)
  - 7 colonnes jour avec en-tête : abréviation 3 lettres + numéro dans un cercle (bleu si aujourd'hui)
  - Lignes horaires fines (`border-border/20`), demi-heures en pointillé subtil
  - Cellules cliquables avec `+` au hover (opacity transition)
  - Events positionnés en absolu avec `top/height` calculés, coins arrondis `rounded-xl`, couleurs douces pastelles (pas saturées)
  - Current time : ligne rouge fine avec point, comme Apple Calendar
- **Vue jour** : Même grille mais une seule colonne, events plus larges
- **Scroll auto** : Au chargement, scroll automatique à l'heure courante - 2h
- **Mobile** : En mode mobile, afficher uniquement la vue jour avec swipe gauche/droite pour changer de jour. Header simplifié.
- **FAB** : Bouton flottant `+` en bas droite, `rounded-full`, shadow Apple douce
- **Section IA** : Panneau rétractable en bas (collapsible) au lieu d'un bloc fixe. Icone sparkles, s'ouvre en slide-up.
- **Empty state calendrier non connecté** : Utiliser l'image pingouin-calendar avec `PagePenguinEmpty`.

### Couleurs events (pastelles Apple)
- Tâches : `bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300`
- Habitudes : `bg-purple-100 text-purple-700`
- Objectifs : `bg-amber-100 text-amber-700`
- Google events : `bg-green-100 text-green-700`

## 2. Images pingouin partout (empty states + décorations)

### Copier les nouvelles images uploadées

Copier les 8 images uploadées dans `src/assets/` :
- `Designer_9-2.png` → `penguin-busy.png` (pingouin débordé avec post-its = page Tâches)
- `Designer_8-2.png` → `penguin-calendar.png` (remplacer l'existant, meilleure version avec calendrier)
- `Designer_7-2.png` → `penguin-thinking.png` (remplacer, version avec bulles de pensée = Dashboard/AI)
- `Designer_6-2.png` → `penguin-workout.png` (remplacer, version avec haltères = Habitudes)
- `Designer_5-2.png` → `penguin-reading.png` (remplacer, version livre = Journal)
- `Designer_4-2.png` → `penguin-focus.png` (remplacer, version casque = Focus)
- `Gemini_Generated_Image_7et0cg7et0cg7et0_1-2.png` → `penguin-journal.png` (remplacer, version écriture)
- `image_2026-03-02_193848709-2.png` → `penguin-mascot.png` (remplacer, version simple)

### Ajouter PagePenguinEmpty aux pages

| Page | Image | Titre | Condition |
|------|-------|-------|-----------|
| Tasks.tsx | penguin-busy | "Pas encore de tâches" | tasks.length === 0 |
| Habits.tsx | penguin-workout | "Pas encore d'habitudes" | habits.length === 0 |
| Goals.tsx | penguin-thinking | "Pas encore d'objectifs" | goals.length === 0 |
| Journal.tsx | penguin-journal | "Votre journal est vide" | entries.length === 0 |
| Focus.tsx | penguin-focus | "Prêt à vous concentrer ?" | no sessions yet |
| Calendar.tsx | penguin-calendar | "Connectez votre calendrier" | !isConnected |
| Analysis.tsx | penguin-reading | "Pas encore de données" | no data |
| Reflection.tsx | penguin-reading | "Aucune réflexion" | reflections.length === 0 |
| Badges.tsx | penguin-mascot | "Aucun badge débloqué" | badges empty |

## 3. Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `src/components/AppleCalendarView.tsx` | **Créer** — Vue calendrier unique Apple |
| `src/pages/Calendar.tsx` | **Réécrire** — Intégrer AppleCalendarView |
| `src/components/GoogleCalendarEventModal.tsx` | **Modifier** — Style Apple inputs |
| `src/components/GoogleCalendarHeader.tsx` | **Supprimer** — Intégré dans AppleCalendarView |
| `src/components/CalendarDayView.tsx` | **Supprimer** — Remplacé |
| `src/components/WeekCalendarView.tsx` | **Supprimer** — Remplacé |
| `src/components/ProfessionalWeekCalendar.tsx` | **Supprimer** — Remplacé |
| `src/pages/Tasks.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Habits.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Goals.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Journal.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Focus.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Analysis.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Reflection.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| `src/pages/Badges.tsx` | **Modifier** — Ajouter PagePenguinEmpty |
| Assets (8 images) | **Copier** — Nouvelles illustrations pingouin |

