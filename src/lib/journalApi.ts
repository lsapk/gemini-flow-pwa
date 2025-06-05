
import { supabase } from "@/integrations/supabase/client";

export const getJournalEntries = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createJournalEntry = async (entry: {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      ...entry,
      user_id: user.id,
      tags: entry.tags || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateJournalEntry = async (id: string, updates: {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      tags: updates.tags || null
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteJournalEntry = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};
