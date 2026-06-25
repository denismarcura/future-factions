
CREATE TABLE public.mystery_box_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  tokens_awarded integer NOT NULL,
  streak_day integer NOT NULL DEFAULT 1,
  bonus_awarded integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_mystery_box_user ON public.mystery_box_opens(user_id, opened_at DESC);

GRANT SELECT ON public.mystery_box_opens TO authenticated;
GRANT ALL ON public.mystery_box_opens TO service_role;

ALTER TABLE public.mystery_box_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own mystery box opens"
  ON public.mystery_box_opens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.open_mystery_box(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_open timestamptz;
  last_streak integer;
  next_streak integer;
  base_reward integer;
  loyalty_bonus integer;
  milestone_bonus integer := 0;
  total integer;
  new_id uuid;
  next_available timestamptz;
BEGIN
  SELECT opened_at, streak_day INTO last_open, last_streak
    FROM public.mystery_box_opens
    WHERE user_id = _user_id
    ORDER BY opened_at DESC
    LIMIT 1;

  IF last_open IS NOT NULL AND last_open > now() - interval '24 hours' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'cooldown',
      'next_available_at', (last_open + interval '24 hours')
    );
  END IF;

  -- Streak: if last open was within 48h (i.e., 24-48h ago), continue. Else reset.
  IF last_open IS NOT NULL AND last_open > now() - interval '48 hours' THEN
    next_streak := COALESCE(last_streak, 0) + 1;
  ELSE
    next_streak := 1;
  END IF;

  base_reward := 100 + floor(random() * 401)::int; -- 100..500
  loyalty_bonus := LEAST(next_streak * 15, 500); -- até +500 conforme fidelidade

  IF next_streak >= 30 THEN
    milestone_bonus := 20000;
    next_streak := 0; -- reseta ciclo após resgatar
  END IF;

  total := base_reward + loyalty_bonus + milestone_bonus;

  INSERT INTO public.mystery_box_opens(user_id, tokens_awarded, streak_day, bonus_awarded)
    VALUES (_user_id, total, GREATEST(next_streak, 1), loyalty_bonus + milestone_bonus)
    RETURNING id INTO new_id;

  INSERT INTO public.token_transactions(user_id, delta, reason)
    VALUES (_user_id, total, 'mystery_box');

  next_available := now() + interval '24 hours';

  RETURN jsonb_build_object(
    'ok', true,
    'tokens', total,
    'base', base_reward,
    'loyalty_bonus', loyalty_bonus,
    'milestone_bonus', milestone_bonus,
    'streak_day', GREATEST(next_streak, 1),
    'next_available_at', next_available
  );
END;
$$;

REVOKE ALL ON FUNCTION public.open_mystery_box(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_mystery_box(uuid) TO authenticated, service_role;
