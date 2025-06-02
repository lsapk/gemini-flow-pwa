
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
    .from('good_action_likes')
    .insert({ good_action_id: goodActionId })
    .select();
  
  if (error) throw error;
  return data;
};

export const unlikeGoodAction = async (goodActionId: string) => {
  const { error } = await supabase
    .from('good_action_likes')
    .delete()
    .eq('good_action_id', goodActionId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
  
  if (error) throw error;
};

export const getGoodActionLikes = async (goodActionId: string) => {
  const { data, error } = await supabase
    .from('good_action_likes')
    .select('*')
    .eq('good_action_id', goodActionId);
  
  if (error) throw error;
  return data || [];
};

export const addComment = async (goodActionId: string, content: string) => {
  const { data, error } = await supabase
    .from('good_action_comments')
    .insert({ good_action_id: goodActionId, content })
    .select();
  
  if (error) throw error;
  return data;
};

export const getComments = async (goodActionId: string) => {
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
  
  if (error) throw error;
  return data || [];
};
