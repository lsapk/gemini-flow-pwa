import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, user_id, event_data, event_id, time_min, time_max } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'No calendar connection found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if token is expired
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.token_expiry) < new Date()) {
      if (!tokenData.refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Token expired and no refresh token available' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      accessToken = await refreshAccessToken(tokenData.refresh_token);
      
      // Update token in database
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);
    }

    let result;

    switch (action) {
      case 'list': {
        console.log('Fetching events from', time_min, 'to', time_max);
        const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
        if (time_min) url.searchParams.set('timeMin', time_min);
        if (time_max) url.searchParams.set('timeMax', time_max);
        url.searchParams.set('singleEvents', 'true');
        url.searchParams.set('orderBy', 'startTime');
        url.searchParams.set('maxResults', '50');

        const response = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Google Calendar list error:', response.status, errorText);
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        result = await response.json();
        console.log('Fetched', result.items?.length || 0, 'events');
        break;
      }

      case 'create': {
        console.log('Creating event with data:', JSON.stringify(event_data));
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event_data),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Google Calendar API error:', response.status, errorText);
          throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
        }
        
        result = await response.json();
        console.log('Event created successfully:', result.id);
        break;
      }

      case 'update': {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event_id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event_data),
          }
        );
        result = await response.json();
        break;
      }

      case 'delete': {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event_id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );
        result = { success: response.ok };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-calendar-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
