import { admin, authenticate, body, config, cors, failure, json, store, tokenRequest } from '../_shared/google.ts';
import { cookieValue, decrypt, encrypt, GOOGLE_SCOPES, GoogleError, hasRequiredScopes, randomSecret, sha256 } from '../_shared/google-domain.ts';

const cookieName = 'deepflow_google_nonce';
interface OAuthState { user_id: string; verifier_cipher: string }

function redirect(location: string, cookie?: string) {
  return new Response(null, { status: 303, headers: {
    Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    ...(cookie ? { 'Set-Cookie': cookie } : {}),
  } });
}

function nonceCookie(nonce: string, settings: ReturnType<typeof config>, clear = false) {
  return `${cookieName}=${nonce}; Path=/functions/v1/google-oauth; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 600}${new URL(settings.supabaseUrl).protocol === 'https:' ? '; Secure' : ''}`;
}

Deno.serve(async (request: Request) => {
  try {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
    const settings = config();
    const db = admin();
    const url = new URL(request.url);
    if (request.method === 'POST') {
      const userId = await authenticate(request, db);
      const input = await body(request);
      if (input.action !== 'start') throw new GoogleError(400, 'Action invalide.', 'invalid_action');
      const state = randomSecret();
      const nonce = randomSecret();
      const verifier = randomSecret();
      const stateHash = await sha256(state);
      await store(db, 'state_create', userId, {
        state_hash: stateHash, nonce_hash: await sha256(nonce),
        verifier_cipher: await encrypt(verifier, settings.encryptionKey, `pkce:${stateHash}`),
      });
      const authorize = new URL(`${settings.supabaseUrl}/functions/v1/google-oauth/authorize`);
      authorize.searchParams.set('state', state);
      authorize.searchParams.set('nonce', nonce);
      return json(request, { url: authorize.href });
    }
    if (request.method !== 'GET') throw new GoogleError(405, 'Méthode non autorisée.', 'method_not_allowed');
    const state = url.searchParams.get('state');
    if (!state || !/^[a-zA-Z0-9_-]{43}$/.test(state)) return redirect(`${settings.origin}/connections?google=invalid_state`);
    const stateHash = await sha256(state);

    if (url.pathname.endsWith('/authorize')) {
      const nonce = url.searchParams.get('nonce');
      if (!nonce || !/^[a-zA-Z0-9_-]{43}$/.test(nonce)) return redirect(`${settings.origin}/connections?google=invalid_state`);
      const pending = await store<OAuthState | null>(db, 'state_begin', null, { state_hash: stateHash, nonce_hash: await sha256(nonce) });
      if (!pending) return redirect(`${settings.origin}/connections?google=invalid_state`);
      const verifier = await decrypt(pending.verifier_cipher, settings.encryptionKey, `pkce:${stateHash}`);
      const consent = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      consent.search = new URLSearchParams({
        client_id: settings.clientId, redirect_uri: settings.redirectUri, response_type: 'code',
        scope: GOOGLE_SCOPES.join(' '), access_type: 'offline', prompt: 'consent select_account',
        state, code_challenge: await sha256(verifier), code_challenge_method: 'S256',
      }).toString();
      return redirect(consent.href, nonceCookie(nonce, settings));
    }

    if (!url.pathname.endsWith('/callback')) throw new GoogleError(404, 'Point de connexion inconnu.', 'not_found');
    const nonce = cookieValue(request.headers.get('Cookie'), cookieName);
    const clearCookie = nonceCookie('', settings, true);
    if (!nonce) return redirect(`${settings.origin}/connections?google=invalid_state`, clearCookie);
    // Atomic DELETE ... RETURNING makes codes single-use even for simultaneous callbacks.
    const pending = await store<OAuthState | null>(db, 'state_consume', null, { state_hash: stateHash, nonce_hash: await sha256(nonce) });
    if (!pending) return redirect(`${settings.origin}/connections?google=invalid_state`, clearCookie);
    if (url.searchParams.has('error')) return redirect(`${settings.origin}/connections?google=denied`, clearCookie);
    const code = url.searchParams.get('code');
    if (!code || code.length > 4096) return redirect(`${settings.origin}/connections?google=invalid_state`, clearCookie);
    try {
      const verifier = await decrypt(pending.verifier_cipher, settings.encryptionKey, `pkce:${stateHash}`);
      const tokens = await tokenRequest({ code, code_verifier: verifier, grant_type: 'authorization_code', redirect_uri: settings.redirectUri });
      const scopes = typeof tokens.scope === 'string' ? tokens.scope.split(' ') : [];
      if (!hasRequiredScopes(scopes) || typeof tokens.access_token !== 'string' || typeof tokens.refresh_token !== 'string' || typeof tokens.expires_in !== 'number') {
        return redirect(`${settings.origin}/connections?google=incomplete`, clearCookie);
      }
      const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(15000),
      });
      if (!profileResponse.ok) throw new Error('Invalid identity response');
      const profile = await profileResponse.json();
      if (typeof profile.sub !== 'string' || !profile.sub || profile.sub.length > 255) throw new Error('Invalid subject');
      // The browser must finish using its current Deepflow session. A copied OAuth start URL
      // therefore cannot link someone else's Google account to the initiator's Deepflow user.
      const confirmation = randomSecret();
      await store(db, 'pending_create', pending.user_id, {
        confirmation_hash: await sha256(confirmation), subject: profile.sub,
        account_email: profile.email_verified === true && typeof profile.email === 'string' ? profile.email : null,
        scopes,
        tokens_cipher: await encrypt(JSON.stringify({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_at: Date.now() + tokens.expires_in * 1000 }),
          settings.encryptionKey, `tokens:${pending.user_id}:${profile.sub}`),
      });
      return redirect(`${settings.origin}/connections?google=ready&confirmation=${confirmation}`, clearCookie);
    } catch {
      return redirect(`${settings.origin}/connections?google=failed`, clearCookie);
    }
  } catch (error) { return failure(request, error); }
});
