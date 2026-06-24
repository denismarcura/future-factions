
-- 1) Add cost_tokens to admin_prizes
ALTER TABLE public.admin_prizes
  ADD COLUMN IF NOT EXISTS cost_tokens integer NOT NULL DEFAULT 0;

-- 2) Prize redemption requests
CREATE TABLE IF NOT EXISTS public.prize_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES public.admin_prizes(id) ON DELETE RESTRICT,
  prize_name text NOT NULL,
  cost_tokens integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  request_ip text,
  ai_fraud_report jsonb,
  ai_fraud_score integer,
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.prize_redemptions TO authenticated;
GRANT ALL ON public.prize_redemptions TO service_role;

ALTER TABLE public.prize_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own redemptions"
  ON public.prize_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own redemptions"
  ON public.prize_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update redemptions"
  ON public.prize_redemptions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER prize_redemptions_set_updated_at
  BEFORE UPDATE ON public.prize_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS prize_redemptions_user_idx ON public.prize_redemptions(user_id);
CREATE INDEX IF NOT EXISTS prize_redemptions_status_idx ON public.prize_redemptions(status);
