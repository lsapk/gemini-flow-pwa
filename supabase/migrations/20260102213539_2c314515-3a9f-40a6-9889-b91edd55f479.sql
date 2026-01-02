-- Ajouter la colonne subscription_tier à la table subscribers si elle n'existe pas déjà avec les bonnes valeurs
-- Et créer une table pour tracker les limites quotidiennes

-- Table pour tracker l'utilisation quotidienne
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  ai_chat_count integer NOT NULL DEFAULT 0,
  ai_analysis_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily usage"
  ON public.daily_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily usage"
  ON public.daily_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily usage"
  ON public.daily_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Table pour les paiements PayPal
CREATE TABLE IF NOT EXISTS public.paypal_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paypal_order_id text NOT NULL,
  paypal_payer_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  subscription_tier text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paypal_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paypal_payments
CREATE POLICY "Users can view their own payments"
  ON public.paypal_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.paypal_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.paypal_payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_paypal_payments_user ON public.paypal_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_paypal_payments_order ON public.paypal_payments(paypal_order_id);