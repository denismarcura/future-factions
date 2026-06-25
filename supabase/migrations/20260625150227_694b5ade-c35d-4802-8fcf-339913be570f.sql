
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS palpite_credits integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.palpite_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  mission_id uuid,
  challenge_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.palpite_credit_transactions TO authenticated;
GRANT ALL ON public.palpite_credit_transactions TO service_role;

ALTER TABLE public.palpite_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credit transactions"
  ON public.palpite_credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_palpite_credit_tx_user ON public.palpite_credit_transactions(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.grant_palpite_credit(
  _user_id uuid,
  _delta integer,
  _reason text,
  _mission_id uuid DEFAULT NULL,
  _challenge_id text DEFAULT NULL
) RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF _delta IS NULL OR _delta = 0 THEN
    SELECT palpite_credits INTO new_balance FROM public.profiles WHERE id = _user_id;
    RETURN COALESCE(new_balance, 0);
  END IF;

  -- For mission claims, ensure idempotency (one grant per mission per user)
  IF _mission_id IS NOT NULL AND _reason = 'mission_claim' THEN
    IF EXISTS (
      SELECT 1 FROM public.palpite_credit_transactions
      WHERE user_id = _user_id AND mission_id = _mission_id AND reason = 'mission_claim'
    ) THEN
      SELECT palpite_credits INTO new_balance FROM public.profiles WHERE id = _user_id;
      RETURN COALESCE(new_balance, 0);
    END IF;
  END IF;

  UPDATE public.profiles
    SET palpite_credits = GREATEST(0, COALESCE(palpite_credits, 0) + _delta)
    WHERE id = _user_id
    RETURNING palpite_credits INTO new_balance;

  INSERT INTO public.palpite_credit_transactions(user_id, delta, reason, mission_id, challenge_id)
    VALUES (_user_id, _delta, _reason, _mission_id, _challenge_id);

  RETURN COALESCE(new_balance, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) TO authenticated, service_role;
