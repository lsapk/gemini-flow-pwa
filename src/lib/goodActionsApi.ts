
import { supabase } from "@/integrations/supabase/client";

export interface GoodActionComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  good_action_id: string;
  is_deleted: boolean;
  user_profiles?: {
    display_name: string;
    email: string;
  };
}

export interface GoodActionLike {
  id: string;
  user_id: string;
  good_action_id: string;
  created_at: string;
}

export const likeGoodAction = async (goodActionId: string) => {
  const { data, error } = await supabase
    .from('good_actions')
    .select('likes_count')
    .eq('id', goodActionId)
    .single();

  if (error) throw error;

  const { error: updateError } = await supabase
    .from('good_actions')
    .update({ likes_count: (data.likes_count || 0) + 1 })
    .eq('id', goodActionId);

  if (updateError) throw updateError;
  return data;
};

export const unlikeGoodAction = async (goodActionId: string) => {
  const { data, error } = await supabase
    .from('good_actions')
    .select('likes_count')
    .eq('id', goodActionId)
    .single();

  if (error) throw error;

  const { error: updateError } = await supabase
    .from('good_actions')
    .update({ likes_count: Math.max((data.likes_count || 0) - 1, 0) })
    .eq('id', goodActionId);

  if (updateError) throw updateError;
  return data;
};

export const getGoodActionLikes = async (goodActionId: string): Promise<GoodActionLike[]> => {
  // Pour l'instant, on retourne un tableau vide car les tables de likes n'existent pas encore
  return [];
};

export const addComment = async (goodActionId: string, content: string) => {
  const { data, error } = await supabase
    .from('good_actions')
    .select('comments_count')
    .eq('id', goodActionId)
    .single();

  if (error) throw error;

  const { error: updateError } = await supabase
    .from('good_actions')
    .update({ comments_count: (data.comments_count || 0) + 1 })
    .eq('id', goodActionId);

  if (updateError) throw updateError;
  return data;
};

export const getComments = async (goodActionId: string): Promise<GoodActionComment[]> => {
  // Pour l'instant, on retourne un tableau vide car les tables de commentaires n'existent pas encore
  return [];
};

export const deleteComment = async (commentId: string) => {
  // Fonctionnalité à implémenter quand les tables seront créées
  console.log('Delete comment:', commentId);
};

export const getAllPublicGoodActions = async () => {
  const { data, error } = await supabase
    .from('good_actions')
    .select(`
      *,
      user_profiles!inner (
        display_name,
        email
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading public good actions:', error);
    return [];
  }
  return data || [];
};
