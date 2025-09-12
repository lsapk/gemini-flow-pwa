-- Ajouter la colonne days_of_week à la table habits
ALTER TABLE public.habits 
ADD COLUMN days_of_week integer[];

-- Ajouter un commentaire pour expliquer le format
COMMENT ON COLUMN public.habits.days_of_week IS 'Jours de la semaine où l''habitude doit être effectuée. 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi. NULL signifie tous les jours.';