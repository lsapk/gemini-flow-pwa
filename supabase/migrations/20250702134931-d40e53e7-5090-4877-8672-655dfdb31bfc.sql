
-- Ajouter sort_order aux tables pour le drag & drop
ALTER TABLE habits ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Ajouter is_archived pour les habitudes (soft delete)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Ajouter is_archived pour les objectifs
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Ajouter parent_task_id pour les sous-tâches (déjà existe dans le schéma)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id);

-- Mettre à jour les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_habits_user_sort ON habits(user_id, sort_order) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_tasks_user_sort ON tasks(user_id, sort_order) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_goals_user_sort ON goals(user_id, sort_order) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Fonction pour réorganiser automatiquement les ordres
CREATE OR REPLACE FUNCTION reorder_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction peut être utilisée pour maintenir l'ordre automatiquement
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
