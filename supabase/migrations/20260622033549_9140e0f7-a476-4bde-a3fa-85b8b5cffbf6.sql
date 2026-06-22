WITH duplicates AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (PARTITION BY user_id, mission_id ORDER BY created_at ASC, id ASC) AS rn
    FROM public.mission_claims
  ) ranked
  WHERE rn > 1
)
DELETE FROM public.mission_claims mc
USING duplicates d
WHERE mc.id = d.id;

ALTER TABLE public.mission_claims
DROP CONSTRAINT IF EXISTS mission_claims_user_id_mission_id_context_key;

ALTER TABLE public.mission_claims
ADD CONSTRAINT mission_claims_user_id_mission_id_key UNIQUE (user_id, mission_id);