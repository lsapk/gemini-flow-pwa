
-- Ajouter la colonne parent_task_id pour les sous-tâches si elle n'existe pas déjà
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Créer un index pour optimiser les requêtes des sous-tâches
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
