-- Tabela para armazenar chaves de API configuráveis pelo admin
-- Acesso exclusivo via service role (supabaseAdmin) — nunca exposta ao client

CREATE TABLE IF NOT EXISTS public.api_settings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name     TEXT        NOT NULL UNIQUE,
  key_value    TEXT        NOT NULL,
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS habilitado: nenhuma regra pública → só service role acessa
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE  public.api_settings                IS 'Chaves de API gerenciadas pelo painel admin. Acesso somente via service role.';
COMMENT ON COLUMN public.api_settings.key_name       IS 'Identificador único da chave, ex: anthropic_api_key';
COMMENT ON COLUMN public.api_settings.key_value      IS 'Valor bruto da chave (nunca exposto ao client)';
COMMENT ON COLUMN public.api_settings.updated_by     IS 'Admin que fez a última alteração';
