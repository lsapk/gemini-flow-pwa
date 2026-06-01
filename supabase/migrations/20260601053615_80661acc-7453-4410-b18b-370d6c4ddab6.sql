
-- ===== OAuth API for DeepFlow developers =====

-- 1. Apps registered by developers
CREATE TABLE public.oauth_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  homepage_url TEXT,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  owner_user_id UUID NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_oauth_apps_owner ON public.oauth_apps(owner_user_id);
CREATE INDEX idx_oauth_apps_client_id ON public.oauth_apps(client_id);

ALTER TABLE public.oauth_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their apps" ON public.oauth_apps
  FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Admins view all apps" ON public.oauth_apps
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_oauth_apps_updated
  BEFORE UPDATE ON public.oauth_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Authorization codes (PKCE)
CREATE TABLE public.oauth_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  pkce_challenge TEXT NOT NULL,
  pkce_method TEXT NOT NULL DEFAULT 'S256',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_oauth_auth_code ON public.oauth_authorizations(code_hash);
CREATE INDEX idx_oauth_auth_user ON public.oauth_authorizations(user_id);

ALTER TABLE public.oauth_authorizations ENABLE ROW LEVEL SECURITY;
-- No public policies: only service role accesses these.

-- 3. Tokens (access + refresh)
CREATE TABLE public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT UNIQUE,
  client_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_oauth_tokens_access ON public.oauth_tokens(access_token_hash);
CREATE INDEX idx_oauth_tokens_refresh ON public.oauth_tokens(refresh_token_hash);
CREATE INDEX idx_oauth_tokens_user ON public.oauth_tokens(user_id);

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own token sessions" ON public.oauth_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users revoke their own tokens" ON public.oauth_tokens
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Active consents (one row per user/app pair)
CREATE TABLE public.oauth_user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (user_id, client_id)
);
CREATE INDEX idx_oauth_consents_user ON public.oauth_user_consents(user_id);

ALTER TABLE public.oauth_user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own consents" ON public.oauth_user_consents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Request logs (90d retention recommended via cron)
CREATE TABLE public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_logs_client ON public.api_request_logs(client_id, created_at DESC);
CREATE INDEX idx_api_logs_user ON public.api_request_logs(user_id, created_at DESC);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view logs of their apps" ON public.api_request_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.oauth_apps a
    WHERE a.client_id = api_request_logs.client_id
      AND a.owner_user_id = auth.uid()
  ));

CREATE POLICY "Users view logs about their data" ON public.api_request_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all logs" ON public.api_request_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
