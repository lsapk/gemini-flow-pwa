
# Plan d'Amélioration : Habitudes, Admin et Dashboard

## Problèmes Identifiés

### 1. Bug Habitudes - Refresh de page
**Cause racine :** Dans `src/pages/Habits.tsx`, la fonction `toggleHabitCompletion` appelle `fetchHabits()` après chaque complétion (ligne 247). Cette fonction recharge TOUTES les habitudes et réinitialise l'état de chargement (`setIsLoading(true)`), ce qui provoque le comportement de "retour au début".

**Solution :** Mise à jour optimiste du state local au lieu de refetch complet. On modifie le state `habits` immédiatement lors du clic, puis on synchronise en arrière-plan.

### 2. Nouvelles Fonctionnalités Admin
L'interface admin actuelle est basique. On ajoute :
- **Statistiques globales** : nombre total de tâches/habitudes/objectifs créés
- **Gestion des rôles** : promouvoir/rétrograder des utilisateurs
- **Logs d'activité** : voir les actions récentes des admins
- **Export de données** : télécharger les stats en CSV
- **Gestion des crédits** : donner/retirer des crédits IA

### 3. Réorganisation du Dashboard
L'ordre actuel n'est pas optimal. Nouvelle hiérarchie :
1. **Annonces admin** (en haut si présentes)
2. **En-tête** avec titre
3. **Raccourcis rapides** (accès immédiat)
4. **Briefing IA** (priorité du jour)
5. **Score de productivité** (métrique principale)
6. **Actions rapides** (tâches du jour, habitudes à faire)
7. **Gamification Widget** (motivation)
8. **Insights IA** (secondaire)

---

## Détails Techniques

### Correction Bug Habitudes

**Fichier :** `src/pages/Habits.tsx`

**Modification de `toggleHabitCompletion` :**

```typescript
const toggleHabitCompletion = async (habitId: string, isCompleted: boolean) => {
  if (!user) return;

  const currentSelectedDate = new Date(selectedDate);
  const targetDate = currentSelectedDate.toISOString().split('T')[0];

  // OPTIMISTIC UPDATE - Mettre à jour immédiatement le state local
  setHabits(prev => prev.map(habit => 
    habit.id === habitId 
      ? { ...habit, is_completed_today: !isCompleted }
      : habit
  ));

  try {
    if (isCompleted) {
      // Supprimer la complétion...
      await supabase.from('habit_completions').delete()...
    } else {
      // Créer la complétion...
      await supabase.from('habit_completions').insert(...)...
    }
    // PAS de fetchHabits() - on garde l'état optimiste
  } catch (error) {
    // ROLLBACK - Revenir à l'état précédent en cas d'erreur
    setHabits(prev => prev.map(habit => 
      habit.id === habitId 
        ? { ...habit, is_completed_today: isCompleted }
        : habit
    ));
    toast.error("Erreur lors de la mise à jour");
  }
};
```

### Nouvelles Fonctionnalités Admin

**Fichier :** `src/pages/Admin.tsx`

**Ajouts :**

1. **Statistiques globales de la plateforme**
```typescript
// Nouveau state
const [platformStats, setPlatformStats] = useState({
  totalTasks: 0,
  totalHabits: 0,
  totalGoals: 0,
  totalFocusHours: 0,
  activeUsersToday: 0,
});

// Nouvelle section dans l'UI
<Card>
  <CardHeader>
    <CardTitle>Statistiques Plateforme</CardTitle>
  </CardHeader>
  <CardContent>
    // Graphiques et métriques globales
  </CardContent>
</Card>
```

2. **Gestion des rôles utilisateurs**
```typescript
// Bouton pour promouvoir admin
const handlePromoteToAdmin = async (userId: string) => {
  await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'admin'
  });
};

// UI avec badge "Admin" et boutons Promouvoir/Rétrograder
```

3. **Attribution de crédits IA**
```typescript
// Nouvelle fonction
const handleGiveCredits = async (userId: string, amount: number) => {
  const { data: profile } = await supabase
    .from('player_profiles')
    .select('ai_credits')
    .eq('user_id', userId)
    .single();
  
  await supabase
    .from('player_profiles')
    .update({ ai_credits: (profile?.ai_credits || 0) + amount })
    .eq('user_id', userId);
};

// Dialog pour entrer le montant
```

4. **Historique des actions admin**
```typescript
// Nouvelle table: admin_actions_log
// Composant pour afficher les dernières actions
<Card>
  <CardHeader>
    <CardTitle>Historique des actions</CardTitle>
  </CardHeader>
  <ScrollArea>
    {adminLogs.map(log => (
      <div>
        {log.action} par {log.admin_email} - {formatDate(log.created_at)}
      </div>
    ))}
  </ScrollArea>
</Card>
```

### Réorganisation Dashboard

**Fichier :** `src/pages/Dashboard.tsx`

**Nouvel ordre des composants :**

```tsx
<div className="space-y-6">
  {/* 1. Annonces admin (critique) */}
  <AdminAnnouncementPanel />

  {/* 2. En-tête */}
  <DashboardHeader />

  {/* 3. Raccourcis rapides (action immédiate) */}
  <QuickLinksSection />

  {/* 4. Score de productivité (métrique clé) */}
  <ProductivityScoreCard />

  {/* 5. NOUVEAU: Actions rapides du jour */}
  <TodayActionsCard />
  {/* 
    - Tâches prioritaires du jour
    - Habitudes à compléter
    - Prochaine session focus suggérée
  */}

  {/* 6. Briefing IA (contextuel) */}
  <DailyBriefingCard />

  {/* 7. Gamification (motivation) */}
  <GamificationWidget />

  {/* 8. Insights IA (secondaire) */}
  <Collapsible>
    <CrossInsightsWidget />
    <SmartInsightsWidget />
    <MonthlyAIReport />
  </Collapsible>
</div>
```

**Nouveau composant : TodayActionsCard**

```typescript
// src/components/dashboard/TodayActionsCard.tsx

export const TodayActionsCard = () => {
  const { tasksData, habitsData } = useAnalyticsData();
  
  const todayTasks = tasksData?.filter(t => 
    !t.completed && isToday(new Date(t.due_date))
  ) || [];
  
  const pendingHabits = habitsData?.filter(h => 
    !h.is_completed_today
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>À faire aujourd'hui</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Tâches du jour */}
          <div>
            <h4>Tâches prioritaires</h4>
            {todayTasks.slice(0, 3).map(task => (
              <TaskMiniCard task={task} />
            ))}
          </div>
          
          {/* Habitudes */}
          <div>
            <h4>Habitudes</h4>
            {pendingHabits.slice(0, 3).map(habit => (
              <HabitMiniCard habit={habit} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Habits.tsx` | Optimistic update pour `toggleHabitCompletion` |
| `src/pages/Admin.tsx` | Nouvelles fonctionnalités admin |
| `src/pages/Dashboard.tsx` | Réorganisation + nouveau composant |
| `src/components/dashboard/TodayActionsCard.tsx` | **NOUVEAU** - Actions rapides |
| `src/hooks/useAdminStats.ts` | **NOUVEAU** - Stats plateforme |

---

## Ordre d'Implémentation

| Priorité | Tâche |
|----------|-------|
| 1 | Corriger le bug de refresh des habitudes (impact UX immédiat) |
| 2 | Créer le composant TodayActionsCard |
| 3 | Réorganiser le Dashboard |
| 4 | Ajouter les fonctionnalités admin (stats, rôles, crédits) |

---

## Résultat Attendu

1. **Habitudes** : Cocher plusieurs habitudes sans refresh, interface fluide
2. **Admin** : Tableau de bord complet avec gestion avancée des utilisateurs
3. **Dashboard** : Hiérarchie claire, actions prioritaires visibles immédiatement
