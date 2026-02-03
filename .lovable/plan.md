
# Plan de Refonte UX/UI : Tâches, Habitudes et Objectifs

## Analyse de l'Existant

Apres analyse approfondie du code, voici les problèmes identifies :

### Problemes actuels

**1. Manque de cohérence visuelle**
- Les 3 listes (TaskList, HabitList, GoalList) ont des styles différents
- TaskList utilise une grille, HabitList et GoalList utilisent une liste verticale
- Les espaces, tailles de polices et paddings varient

**2. Interface trop dense**
- Trop d'informations affichées en même temps
- Boutons d'action toujours visibles (encombrant)
- Pas de hiérarchie visuelle claire

**3. Interactions non optimales**
- Le drag-and-drop existe mais pas de feedback visuel satisfaisant
- Les checkboxes sont petites et difficiles à cliquer sur mobile
- Pas d'animations de transition lors des actions

**4. Manque de fonctionnalités UX modernes**
- Pas de swipe actions sur mobile
- Pas de filtrage rapide
- Pas de vue compacte vs détaillée

---

## Solutions Proposées

### 1. Nouveau Design System Unifié

Créer un composant `ItemCard` réutilisable avec 3 variantes :
- **Compact** : Une ligne, juste le titre et checkbox
- **Standard** : Titre, description courte, badges principaux
- **Expanded** : Toutes les infos + sous-éléments

**Structure visuelle :**
```text
┌─────────────────────────────────────────────────────────┐
│  ○ ════════════════════════════════════════ [badges]   │
│    Titre de l'élément                                   │
│    Description courte...                    [actions]   │
│    ─────────────────────────────────────────────────── │
│    ▸ 3 sous-éléments                                   │
└─────────────────────────────────────────────────────────┘
```

### 2. Animations et Micro-interactions

- **Check animation** : Cercle qui se remplit avec effet "confetti" subtil
- **Drag feedback** : Ombre portée + légère rotation lors du drag
- **Hover states** : Boutons d'action apparaissent au survol (cachés par défaut)
- **Swipe gestures** : Swipe gauche = supprimer, swipe droit = compléter (mobile)
- **Transitions fluides** : Utiliser Framer Motion pour toutes les animations

### 3. Header Amélioré avec Filtres

Ajouter une barre de filtrage/recherche :
```text
┌─────────────────────────────────────────────────────────┐
│  🔍 Rechercher...    [Toutes] [Haute] [Moyenne] [Basse] │
│  ☰ Liste  ▦ Grille  ▤ Compact      📅 Aujourd'hui ▼    │
└─────────────────────────────────────────────────────────┘
```

### 4. Quick Actions Contextuelles

- **Long press / Right click** : Menu contextuel avec actions rapides
- **Inline editing** : Double-clic pour éditer le titre directement
- **Bulk actions** : Sélection multiple avec actions groupées

### 5. Indicateurs Visuels Enrichis

- **Progress rings** : Cercles de progression animés pour les objectifs
- **Streak flames** : Animation de flamme pour les séries d'habitudes
- **Priority indicators** : Barre colorée sur le côté gauche de la carte
- **Due date badges** : Couleur dynamique (vert > 3j, orange < 3j, rouge = dépassé)

---

## Implémentation Technique

### Fichiers à créer

```text
src/components/shared/
├── ItemCard.tsx              # Composant carte unifié
├── ItemCardActions.tsx       # Actions contextuelles
├── ItemCardBadges.tsx        # Badges réutilisables
├── CheckCircle.tsx           # Checkbox animée custom
├── ProgressRing.tsx          # Anneau de progression SVG
├── SwipeableItem.tsx         # Wrapper pour swipe gestures
├── FilterBar.tsx             # Barre de filtrage
├── ViewToggle.tsx            # Toggle liste/grille/compact
└── QuickActionsMenu.tsx      # Menu contextuel
```

### Fichiers à modifier

```text
src/components/TaskList.tsx    # Utiliser nouveaux composants
src/components/HabitList.tsx   # Utiliser nouveaux composants
src/components/GoalList.tsx    # Utiliser nouveaux composants
src/pages/Tasks.tsx            # Ajouter FilterBar
src/pages/Habits.tsx           # Ajouter FilterBar
src/pages/Goals.tsx            # Ajouter FilterBar
```

### Nouvelles dépendances

Aucune nouvelle dépendance requise :
- `framer-motion` : déjà installé
- `@dnd-kit` : déjà installé

---

## Détail des Composants

### 1. ItemCard.tsx - Carte Unifiée

**Props :**
- `type`: 'task' | 'habit' | 'goal'
- `variant`: 'compact' | 'standard' | 'expanded'
- `data`: Task | Habit | Goal
- `onComplete`, `onEdit`, `onDelete`
- `showActions`: boolean (hover vs always)

**Features :**
- Indicateur de priorité coloré sur le bord gauche
- Checkbox animée avec effet de complétion
- Actions au survol (desktop) ou swipe (mobile)
- Animation d'entrée/sortie avec Framer Motion

### 2. CheckCircle.tsx - Checkbox Animée

**Design :**
- Cercle au lieu de carré (plus moderne)
- Animation de remplissage lors du check
- Effet de "pop" satisfaisant
- Couleur selon le type (vert success pour tous)

### 3. ProgressRing.tsx - Anneau de Progression

**Pour les objectifs :**
- SVG animé montrant le pourcentage
- Gradient de couleur selon progression
- Animation au chargement et changement

### 4. FilterBar.tsx - Barre de Filtrage

**Features :**
- Recherche en temps réel
- Filtres par priorité (chips cliquables)
- Toggle de vue (liste/grille/compact)
- Filtre par date (aujourd'hui/cette semaine/tout)

### 5. SwipeableItem.tsx - Gestes Mobile

**Utilisation de Framer Motion :**
- Swipe gauche : révèle bouton supprimer (rouge)
- Swipe droit : marque comme complété (vert)
- Feedback haptique (vibration) si disponible

---

## Améliorations Spécifiques par Type

### Tâches

- **Priority lane** : Barre verticale colorée à gauche
- **Due date smart badge** : "Aujourd'hui", "Demain", "En retard"
- **Subtask preview** : Mini barre de progression inline
- **Quick complete** : Swipe droit

### Habitudes

- **Streak badge animé** : Flamme avec compteur
- **Completion ring** : Cercle de progression journalier
- **Days indicator** : Points pour les jours de la semaine
- **Category color** : Bordure colorée par catégorie

### Objectifs

- **Progress ring** : Grand anneau de progression (0-100%)
- **Milestone markers** : Points sur l'anneau (25%, 50%, 75%)
- **Target date countdown** : "J-15" avec couleur dynamique
- **Subobjectives collapse** : Accordéon fluide

---

## Responsive Design

### Mobile (< 640px)
- Vue liste uniquement (pas de grille)
- Swipe actions activées
- Actions dans menu contextuel
- Checkbox plus grande (touch-friendly)

### Tablet (640px - 1024px)
- Grille 2 colonnes optionnelle
- Actions au survol
- Tous les filtres visibles

### Desktop (> 1024px)
- Grille jusqu'à 3 colonnes
- Actions au survol
- Sidebar avec statistiques rapides

---

## Exemples Visuels (ASCII)

### Carte Tâche Standard
```text
┌─────────────────────────────────────────────────────────┐
│█                                                        │
│█  ◯  Rédiger le rapport mensuel                        │
│█     Préparer le document pour la réunion de lundi     │
│█                                                        │
│█     🔴 Haute    📅 Demain    ⏱️ Créé il y a 2h        │
│█     ───────────────────────────────────────────────── │
│█     ▸ 2/5 sous-tâches  ━━━━━━━░░░ 40%                │
└─────────────────────────────────────────────────────────┘
```

### Carte Habitude Standard
```text
┌─────────────────────────────────────────────────────────┐
│  ◉  Méditation matinale                    🔥 12        │
│     10 minutes de pleine conscience                     │
│                                                         │
│     🟢 Quotidien   L M M J V S D                        │
│                    ● ● ● ○ ○ ○ ○                        │
└─────────────────────────────────────────────────────────┘
```

### Carte Objectif Standard
```text
┌─────────────────────────────────────────────────────────┐
│  ╭───╮                                                  │
│  │72%│  Lancer le MVP du projet                         │
│  ╰───╯  Finaliser et déployer la v1                    │
│                                                         │
│     🏷️ Carrière   📅 J-23   ▸ 4 sous-objectifs         │
│     ━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░                      │
└─────────────────────────────────────────────────────────┘
```

---

## Ordre d'Implémentation

| Étape | Composant | Priorité |
|-------|-----------|----------|
| 1 | CheckCircle.tsx (checkbox animée) | Haute |
| 2 | ItemCard.tsx (structure de base) | Haute |
| 3 | ItemCardBadges.tsx (badges réutilisables) | Haute |
| 4 | ProgressRing.tsx (pour objectifs) | Moyenne |
| 5 | TaskList refactoring | Haute |
| 6 | HabitList refactoring | Haute |
| 7 | GoalList refactoring | Haute |
| 8 | FilterBar.tsx | Moyenne |
| 9 | ViewToggle.tsx | Moyenne |
| 10 | SwipeableItem.tsx (mobile) | Basse |
| 11 | QuickActionsMenu.tsx | Basse |

---

## Résultat Attendu

Cette refonte apportera :

1. **Cohérence visuelle** : Même design system pour les 3 types d'éléments
2. **Fluidité** : Animations et transitions satisfaisantes
3. **Praticité** : Actions contextuelles, filtres, recherche
4. **Modernité** : Design proche des meilleures apps de productivité (Todoist, Things 3)
5. **Accessibilité** : Touch targets plus grands, contraste amélioré
6. **Performance** : Optimisation avec virtualization si nécessaire

Le tout en conservant 100% des fonctionnalités existantes (drag-drop, edit, delete, complete, subtasks, etc.)
