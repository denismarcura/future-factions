ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_platform_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_platform_check CHECK (platform = ANY (ARRAY['instagram','youtube','google','facebook','tiktok']));
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_action_type_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_action_type_check CHECK (action_type = ANY (ARRAY['follow','like','comment','share','tag','review','like_comment','subscribe']));