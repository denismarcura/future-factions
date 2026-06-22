-- 1. email_notifications: rastreia envios por participante
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  position integer,
  points integer,
  tokens integer,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id, template)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_notifications TO service_role;

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email notifications"
  ON public.email_notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own notifications"
  ON public.email_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_email_notif_challenge ON public.email_notifications(challenge_id);
CREATE INDEX idx_email_notif_user ON public.email_notifications(user_id);

CREATE TRIGGER trg_email_notif_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. challenge_result_audit: histórico imutável de mudanças de resultado
CREATE TABLE IF NOT EXISTS public.challenge_result_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL,
  previous_result jsonb,
  new_result jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.challenge_result_audit TO authenticated;
GRANT ALL ON public.challenge_result_audit TO service_role;

ALTER TABLE public.challenge_result_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
  ON public.challenge_result_audit FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert audit"
  ON public.challenge_result_audit FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_result_audit_challenge ON public.challenge_result_audit(challenge_id);

-- 3. Idempotência no crédito de tokens (impede duplo crédito por winner)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_token_tx_per_winner
  ON public.token_transactions(winner_id)
  WHERE winner_id IS NOT NULL;

-- 4. Rastreia se já notificamos o vencedor
ALTER TABLE public.challenge_winners
  ADD COLUMN IF NOT EXISTS email_notified_at timestamptz;