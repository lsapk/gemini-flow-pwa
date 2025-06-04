
import { supabase } from "@/integrations/supabase/client";
import { GoodActionComment, GoodActionLike } from "@/types";

export const likeGoodAction = async (goodActionId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Vérifier si l'utilisateur a déjà liké
  const { data: existingLike } = await supabase
    .from('good_action_likes')
    .select('id')
    .eq('good_action_id', goodActionId)
    .eq('user_id', user.id)
    .single();

  if (existingLike) {
    // Déjà liké, on retire le like
    await supabase
      .from('good_action_likes')
      .delete()
      .eq('id', existingLike.id);

    // Décrémenter le compteur
    const { data } = await supabase
      .from('good_actions')
      .select('likes_count')
      .eq('id', goodActionId)
      .single();

    await supabase
      .from('good_actions')
      .update({ likes_count: Math.max((data?.likes_count || 0) - 1, 0) })
      .eq('id', goodActionId);

    return false; // Unlike
  } else {
    // Pas encore liké, on ajoute le like
    await supabase
      .from('good_action_likes')
      .insert({
        good_action_id: goodActionId,
        user_id: user.id
      });

    // Incrémenter le compteur
    const { data } = await supabase
      .from('good_actions')
      .select('likes_count')
      .eq('id', goodActionId)
      .single();

    await supabase
      .from('good_actions')
      .update({ likes_count: (data?.likes_count || 0) + 1 })
      .eq('id', goodActionId);

    return true; // Like
  }
};

export const checkUserLike = async (goodActionId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('good_action_likes')
    .select('id')
    .eq('good_action_id', goodActionId)
    .eq('user_id', user.id)
    .single();

  return !!data;
};

export const getGoodActionLikes = async (goodActionId: string): Promise<GoodActionLike[]> => {
  const { data, error } = await supabase
    .from('good_action_likes')
    .select('*')
    .eq('good_action_id', goodActionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addComment = async (goodActionId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_action_comments')
    .insert({
      good_action_id: goodActionId,
      user_id: user.id,
      content: content.trim()
    })
    .select(`
      *,
      user_profiles (
        display_name,
        email
      )
    `)
    .single();

  if (error) throw error;

  // Incrémenter le compteur de commentaires
  const { data: actionData } = await supabase
    .from('good_actions')
    .select('comments_count')
    .eq('id', goodActionId)
    .single();

  await supabase
    .from('good_actions')
    .update({ comments_count: (actionData?.comments_count || 0) + 1 })
    .eq('id', goodActionId);

  return data;
};

export const getComments = async (goodActionId: string): Promise<GoodActionComment[]> => {
  const { data, error } = await supabase
    .from('good_action_comments')
    .select(`
      *,
      user_profiles (
        display_name,
        email
      )
    `)
    .eq('good_action_id', goodActionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const deleteComment = async (commentId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Soft delete
  const { error } = await supabase
    .from('good_action_comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('user_id', user.id); // S'assurer que l'utilisateur peut seulement supprimer ses propres commentaires

  if (error) throw error;
};

export const moderateComment = async (commentId: string) => {
  const { error } = await supabase
    .from('good_action_comments')
    .update({ is_deleted: true })
    .eq('id', commentId);

  if (error) throw error;
};

export const getAllPublicGoodActions = async () => {
  const { data, error } = await supabase
    .from('good_actions')
    .select(`
      *,
      user_profiles (
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

export const getUserGoodActions = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_actions')
    .select(`
      *,
      user_profiles (
        display_name,
        email
      )
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createGoodAction = async (actionData: {
  title: string;
  description?: string;
  category: string;
  is_public: boolean;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_actions')
    .insert({
      ...actionData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateGoodAction = async (id: string, updates: {
  title?: string;
  description?: string;
  category?: string;
  is_public?: boolean;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_actions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // S'assurer que l'utilisateur peut seulement modifier ses propres actions
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteGoodAction = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('good_actions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // S'assurer que l'utilisateur peut seulement supprimer ses propres actions

  if (error) throw error;
};
