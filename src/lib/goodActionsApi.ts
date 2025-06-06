
import { supabase } from "@/integrations/supabase/client";

export interface GoodAction {
  id: string;
  title: string;
  description?: string;
  category: string;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  user_profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export interface GoodActionComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_deleted: boolean;
  user_profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export const getGoodActions = async (publicOnly = false) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from('good_actions')
    .select(`
      *,
      user_profiles(display_name, email)
    `)
    .order('created_at', { ascending: false });

  if (publicOnly) {
    query = query.eq('is_public', true);
  } else if (user) {
    query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getAllPublicGoodActions = async () => {
  return getGoodActions(true);
};

export const getUserGoodActions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_actions')
    .select(`
      *,
      user_profiles(display_name, email)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createGoodAction = async (action: {
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
      ...action,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateGoodAction = async (id: string, action: {
  title: string;
  description?: string;
  category: string;
  is_public: boolean;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_actions')
    .update(action)
    .eq('id', id)
    .eq('user_id', user.id)
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
    .eq('id', id);

  if (error) throw error;
};

export const likeGoodAction = async (goodActionId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('good_action_likes')
    .select('id')
    .eq('good_action_id', goodActionId)
    .eq('user_id', user.id)
    .single();

  if (existingLike) {
    // Remove like
    const { error: deleteError } = await supabase
      .from('good_action_likes')
      .delete()
      .eq('good_action_id', goodActionId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Manually decrement counter
    const { data: currentAction } = await supabase
      .from('good_actions')
      .select('likes_count')
      .eq('id', goodActionId)
      .single();

    if (currentAction) {
      const { error: updateError } = await supabase
        .from('good_actions')
        .update({ likes_count: Math.max(0, currentAction.likes_count - 1) })
        .eq('id', goodActionId);

      if (updateError) throw updateError;
    }
    return false;
  } else {
    // Add like
    const { error: insertError } = await supabase
      .from('good_action_likes')
      .insert({
        good_action_id: goodActionId,
        user_id: user.id,
      });

    if (insertError) throw insertError;

    // Manually increment counter
    const { data: currentAction } = await supabase
      .from('good_actions')
      .select('likes_count')
      .eq('id', goodActionId)
      .single();

    if (currentAction) {
      const { error: updateError } = await supabase
        .from('good_actions')
        .update({ likes_count: currentAction.likes_count + 1 })
        .eq('id', goodActionId);

      if (updateError) throw updateError;
    }
    return true;
  }
};

export const checkUserLike = async (goodActionId: string) => {
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

export const getGoodActionComments = async (goodActionId: string) => {
  const { data, error } = await supabase
    .from('good_action_comments')
    .select(`
      *,
      user_profiles(display_name, email)
    `)
    .eq('good_action_id', goodActionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getComments = async (goodActionId: string) => {
  return getGoodActionComments(goodActionId);
};

export const addComment = async (goodActionId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('good_action_comments')
    .insert({
      good_action_id: goodActionId,
      user_id: user.id,
      content,
    })
    .select(`
      *,
      user_profiles(display_name, email)
    `)
    .single();

  if (error) throw error;

  // Manually increment comments counter
  const { data: currentAction } = await supabase
    .from('good_actions')
    .select('comments_count')
    .eq('id', goodActionId)
    .single();

  if (currentAction) {
    const { error: updateError } = await supabase
      .from('good_actions')
      .update({ comments_count: currentAction.comments_count + 1 })
      .eq('id', goodActionId);

    if (updateError) throw updateError;
  }

  return data;
};

export const deleteComment = async (commentId: string, goodActionId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get action ID if not provided
  let actionId = goodActionId;
  if (!actionId) {
    const { data: comment } = await supabase
      .from('good_action_comments')
      .select('good_action_id')
      .eq('id', commentId)
      .single();
    
    if (comment) {
      actionId = comment.good_action_id;
    }
  }

  const { error } = await supabase
    .from('good_action_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;

  // Manually decrement comments counter if we have action ID
  if (actionId) {
    const { data: currentAction } = await supabase
      .from('good_actions')
      .select('comments_count')
      .eq('id', actionId)
      .single();

    if (currentAction) {
      const { error: updateError } = await supabase
        .from('good_actions')
        .update({ comments_count: Math.max(0, currentAction.comments_count - 1) })
        .eq('id', actionId);

      if (updateError) throw updateError;
    }
  }
};

export const moderateComment = async (commentId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('good_action_comments')
    .update({ is_deleted: true })
    .eq('id', commentId);

  if (error) throw error;
};
