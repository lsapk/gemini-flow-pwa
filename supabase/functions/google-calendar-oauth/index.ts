import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: Allowlist of valid redirect origins
const ALLOWED_ORIGINS = [
  'https://deepflowia.lovable.app',
  'https://id-preview--fa41ffac-18ed-45b6-963f-8f73e3ad9383.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getSafeRedirectUri(req: Request): string {
  const origin = req.headers.get('origin') || '';
  const safeOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return `${safeOrigin}/calendar`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action } = requestBody;

    const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Authenticate user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const authenticatedUserId = user.id;
    console.log('Authenticated user:', authenticatedUserId);

    const REDIRECT_URI = getSafeRedirectUri(req);

    if (action === 'get_auth_url') {
      const SCOPE = 'https://www.googleapis.com/auth/calendar';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(SCOPE)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${authenticatedUserId}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for tokens
    const { code } = requestBody;
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: dbError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .upsert({
        user_id: authenticatedUserId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save tokens');
    }

    console.log('Tokens saved successfully for user:', authenticatedUserId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-calendar-oauth:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
