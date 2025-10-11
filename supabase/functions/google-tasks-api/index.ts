import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, user_id, task_data, task_id, task_list_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user's tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_tasks_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('No Google Tasks connection found');
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired
    const tokenExpiry = new Date(tokenData.token_expiry);
    if (tokenExpiry <= new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshAccessToken(tokenData.refresh_token);

      const newExpiry = new Date(Date.now() + 3600 * 1000);
      await supabaseClient
        .from('google_tasks_tokens')
        .update({
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
        })
        .eq('user_id', user_id);
    }

    let apiUrl = '';
    let method = 'GET';
    let body = null;

    // Get the default task list ID if not provided
    let targetTaskListId = task_list_id;
    if (!targetTaskListId && action !== 'list_task_lists') {
      const listsResponse = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const listsData = await listsResponse.json();
      targetTaskListId = listsData.items?.[0]?.id;
    }

    switch (action) {
      case 'list_task_lists':
        apiUrl = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
        break;
      
      case 'list':
        apiUrl = `https://tasks.googleapis.com/tasks/v1/lists/${targetTaskListId}/tasks?showCompleted=true&showHidden=true`;
        break;

      case 'create':
        apiUrl = `https://tasks.googleapis.com/tasks/v1/lists/${targetTaskListId}/tasks`;
        method = 'POST';
        body = JSON.stringify({
          title: task_data.title,
          notes: task_data.notes,
          due: task_data.due,
        });
        break;

      case 'update':
        apiUrl = `https://tasks.googleapis.com/tasks/v1/lists/${targetTaskListId}/tasks/${task_id}`;
        method = 'PATCH';
        body = JSON.stringify(task_data);
        break;

      case 'delete':
        apiUrl = `https://tasks.googleapis.com/tasks/v1/lists/${targetTaskListId}/tasks/${task_id}`;
        method = 'DELETE';
        break;

      default:
        throw new Error('Invalid action');
    }

    const response = await fetch(apiUrl, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Tasks API error:', errorText);
      throw new Error(`Google Tasks API error: ${response.status}`);
    }

    const result = method === 'DELETE' ? {} : await response.json();

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-tasks-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
