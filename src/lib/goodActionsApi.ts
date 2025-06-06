
import { supabase } from "@/integrations/supabase/client";

// Types pour les bonnes actions
export interface GoodAction {
  id: string;
  title: string;
  description: string;
  category: string;
  user_id: string;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profiles?: {
    display_name: string;
    email: string;
  } | null;
}

export interface GoodActionComment {
  id: string;
  content: string;
  user_id: string;
  good_action_id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user_profiles?: {
    display_name: string;
    email: string;
  } | null;
}

// Récupérer toutes les bonnes actions publiques
export const getPublicGoodActions = async (): Promise<GoodAction[]> => {
  try {
    const { data, error } = await supabase
      .from('good_actions')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des bonnes actions:', error);
      throw error;
    }

    // Récupérer les profils utilisateur séparément
    const userIds = data?.map(action => action.user_id) || [];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds);

    // Combiner les données
    const actionsWithProfiles = data?.map(action => ({
      ...action,
      user_profiles: profiles?.find(profile => profile.id === action.user_id) || null
    })) || [];

    return actionsWithProfiles;
  } catch (error) {
    console.error('Erreur dans getPublicGoodActions:', error);
    throw error;
  }
};

// Récupérer les bonnes actions d'un utilisateur
export const getUserGoodActions = async (userId: string): Promise<GoodAction[]> => {
  try {
    const { data, error } = await supabase
      .from('good_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des bonnes actions utilisateur:', error);
      throw error;
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .eq('id', userId)
      .single();

    // Combiner les données
    const actionsWithProfile = data?.map(action => ({
      ...action,
      user_profiles: profile || null
    })) || [];

    return actionsWithProfile;
  } catch (error) {
    console.error('Erreur dans getUserGoodActions:', error);
    throw error;
  }
};

// Créer une nouvelle bonne action
export const createGoodAction = async (goodAction: {
  title: string;
  description: string;
  category: string;
  is_public: boolean;
}): Promise<GoodAction> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('good_actions')
      .insert({
        ...goodAction,
        user_id: user.id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erreur lors de la création de la bonne action:', error);
      throw error;
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .eq('id', user.id)
      .single();

    return {
      ...data,
      user_profiles: profile || null
    };
  } catch (error) {
    console.error('Erreur dans createGoodAction:', error);
    throw error;
  }
};

// Supprimer une bonne action
export const deleteGoodAction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('good_actions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression de la bonne action:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans deleteGoodAction:', error);
    throw error;
  }
};

// Récupérer les commentaires d'une bonne action
export const getGoodActionComments = async (goodActionId: string): Promise<GoodActionComment[]> => {
  try {
    const { data, error } = await supabase
      .from('good_action_comments')
      .select('*')
      .eq('good_action_id', goodActionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      throw error;
    }

    // Récupérer les profils utilisateur séparément
    const userIds = data?.map(comment => comment.user_id) || [];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds);

    // Combiner les données
    const commentsWithProfiles = data?.map(comment => ({
      ...comment,
      user_profiles: profiles?.find(profile => profile.id === comment.user_id) || null
    })) || [];

    return commentsWithProfiles;
  } catch (error) {
    console.error('Erreur dans getGoodActionComments:', error);
    throw error;
  }
};

// Ajouter un commentaire
export const addGoodActionComment = async (comment: {
  content: string;
  good_action_id: string;
}): Promise<GoodActionComment> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('good_action_comments')
      .insert({
        ...comment,
        user_id: user.id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      throw error;
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .eq('id', user.id)
      .single();

    return {
      ...data,
      user_profiles: profile || null
    };
  } catch (error) {
    console.error('Erreur dans addGoodActionComment:', error);
    throw error;
  }
};

// Supprimer un commentaire
export const deleteGoodActionComment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('good_action_comments')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans deleteGoodActionComment:', error);
    throw error;
  }
};

// Ajouter un like
export const addGoodActionLike = async (goodActionId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('good_action_likes')
      .insert({ 
        good_action_id: goodActionId,
        user_id: user.id
      });

    if (error) {
      console.error('Erreur lors de l\'ajout du like:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans addGoodActionLike:', error);
    throw error;
  }
};

// Supprimer un like
export const removeGoodActionLike = async (goodActionId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('good_action_likes')
      .delete()
      .eq('good_action_id', goodActionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur lors de la suppression du like:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans removeGoodActionLike:', error);
    throw error;
  }
};

// Vérifier si l'utilisateur a liké une bonne action
export const hasUserLikedGoodAction = async (goodActionId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('good_action_likes')
      .select('id')
      .eq('good_action_id', goodActionId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification du like:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Erreur dans hasUserLikedGoodAction:', error);
    return false;
  }
};
