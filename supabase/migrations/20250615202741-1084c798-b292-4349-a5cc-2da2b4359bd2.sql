
-- Activer la Row Level Security sur la table user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Autoriser un utilisateur à voir son propre profil
CREATE POLICY "Users can select their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Autoriser un utilisateur à insérer son propre profil (utile si la row n'existe pas encore)
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Autoriser un utilisateur à mettre à jour son propre profil
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Autoriser un utilisateur à supprimer son propre profil (optionnel - à activer selon besoin)
-- CREATE POLICY "Users can delete their own profile"
--   ON public.user_profiles
--   FOR DELETE
--   USING (id = auth.uid());
