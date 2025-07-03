
-- Ajouter la colonne sort_order pour les habitudes si elle n'existe pas déjà
ALTER TABLE habits ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Ajouter la colonne sort_order pour les objectifs si elle n'existe pas déjà
ALTER TABLE goals ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Ajouter la colonne parent_task_id pour les sous-tâches si elle n'existe pas déjà
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Mettre à jour les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_goals_sort_order ON goals(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
