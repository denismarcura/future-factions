ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL;
COMMENT ON COLUMN public.profiles.cpf IS 'CPF (apenas dígitos). Validado por algoritmo no servidor. Único por usuário, exigido no resgate de prêmios.';