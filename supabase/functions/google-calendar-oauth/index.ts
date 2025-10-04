import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing code or user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const REDIRECT_URI = `${req.headers.get('origin')}/calendar`;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Save tokens to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: dbError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save tokens');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-calendar-oauth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
