-- Sprint 2 - Central de Comunicacao: modelagem do banco de emails.
-- Escopo: somente banco de dados.

CREATE TABLE IF NOT EXISTS public.email_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'resend',
  from_email text,
  from_name text,
  reply_to text,
  domain text,
  is_default boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'info',
  queue_id uuid REFERENCES public.email_queue(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.email_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  data_type text NOT NULL DEFAULT 'text',
  default_value text,
  example_value text,
  is_required boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS preheader text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS text_body text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS variables_schema jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS audience jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS finished_at timestamptz;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'queued';
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS to_email text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS text_body text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received';
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS queue_id uuid REFERENCES public.email_queue(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.email_providers(id) ON DELETE SET NULL;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS provider_event_id text;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'transactional';
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS opted_in boolean NOT NULL DEFAULT true;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS opted_out_at timestamptz;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS opt_out_reason text;
ALTER TABLE public.email_preferences ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.email_preferences SET id = COALESCE(id, gen_random_uuid()) WHERE id IS NULL;
ALTER TABLE public.email_preferences ALTER COLUMN id SET NOT NULL;

UPDATE public.email_templates
SET created_at = COALESCE(created_at, criado_em, now()),
    updated_at = COALESCE(updated_at, atualizado_em, now()),
    name = COALESCE(name, nome),
    html_body = COALESCE(html_body, html)
WHERE created_at IS NULL OR updated_at IS NULL OR name IS NULL OR html_body IS NULL;

UPDATE public.email_campaigns
SET created_at = COALESCE(created_at, criado_em, now()),
    updated_at = COALESCE(updated_at, atualizado_em, now()),
    created_by = COALESCE(created_by, criado_por),
    template_id = COALESCE(template_id, template),
    scheduled_at = COALESCE(scheduled_at, agendamento)
WHERE created_at IS NULL OR updated_at IS NULL OR created_by IS NULL OR template_id IS NULL OR scheduled_at IS NULL;

UPDATE public.email_queue
SET created_at = COALESCE(created_at, criado_em, now()),
    updated_at = COALESCE(updated_at, atualizado_em, now()),
    campaign_id = COALESCE(campaign_id, campanha),
    scheduled_at = COALESCE(scheduled_at, data_execucao),
    attempts = COALESCE(attempts, tentativas),
    provider_message_id = COALESCE(provider_message_id, message_id),
    last_error = COALESCE(last_error, erro)
WHERE created_at IS NULL OR updated_at IS NULL OR campaign_id IS NULL OR provider_message_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_providers_default_unique ON public.email_providers(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_email_providers_status ON public.email_providers(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_key_unique ON public.email_templates(key) WHERE key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_scheduled ON public.email_campaigns(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template_id ON public.email_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_at, priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_campaign_id ON public.email_queue(campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_queue_idempotency_unique ON public.email_queue(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_status_created_at ON public.email_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_queue_id ON public.email_logs(queue_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_events_provider_event_unique ON public.email_events(provider, provider_event_id) WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_events_status_created_at ON public.email_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_provider_message_id ON public.email_events(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_category ON public.email_preferences(user_id, category, channel);
CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON public.email_preferences(email);
CREATE INDEX IF NOT EXISTS idx_email_variables_status ON public.email_variables(status);
CREATE INDEX IF NOT EXISTS idx_email_variables_category ON public.email_variables(category);

DROP TRIGGER IF EXISTS set_email_providers_updated_at ON public.email_providers;
CREATE TRIGGER set_email_providers_updated_at BEFORE UPDATE ON public.email_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER set_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER set_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_queue_updated_at ON public.email_queue;
CREATE TRIGGER set_email_queue_updated_at BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER set_email_logs_updated_at BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_events_updated_at ON public.email_events;
CREATE TRIGGER set_email_events_updated_at BEFORE UPDATE ON public.email_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_preferences_updated_at ON public.email_preferences;
CREATE TRIGGER set_email_preferences_updated_at BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_email_variables_updated_at ON public.email_variables;
CREATE TRIGGER set_email_variables_updated_at BEFORE UPDATE ON public.email_variables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_variables TO authenticated;

GRANT ALL ON public.email_providers TO service_role;
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_campaigns TO service_role;
GRANT ALL ON public.email_queue TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.email_events TO service_role;
GRANT ALL ON public.email_preferences TO service_role;
GRANT ALL ON public.email_variables TO service_role;

ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_variables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage email providers" ON public.email_providers
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email templates" ON public.email_templates
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email campaigns" ON public.email_campaigns
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email queue" ON public.email_queue
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email logs" ON public.email_logs
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email events" ON public.email_events
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage central email preferences" ON public.email_preferences
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own central email preferences" ON public.email_preferences
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.email_contacts c WHERE c.id = contato_id AND c.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own central email preferences" ON public.email_preferences
    FOR UPDATE TO authenticated
    USING (
      user_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.email_contacts c WHERE c.id = contato_id AND c.user_id = auth.uid())
    )
    WITH CHECK (
      user_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.email_contacts c WHERE c.id = contato_id AND c.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email variables" ON public.email_variables
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email providers" ON public.email_providers
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email logs" ON public.email_logs
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email variables" ON public.email_variables
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.email_providers IS 'Provedores de e-mail da Central de Comunicacao, incluindo Resend.';
COMMENT ON TABLE public.email_templates IS 'Templates de e-mail utilizados por comunicacoes transacionais, marketing, newsletter e campanhas automaticas.';
COMMENT ON TABLE public.email_campaigns IS 'Campanhas de e-mail da Central de Comunicacao.';
COMMENT ON TABLE public.email_queue IS 'Fila centralizada de mensagens de e-mail antes do envio pelo provedor.';
COMMENT ON TABLE public.email_logs IS 'Logs internos de processamento, auditoria e erros da Central de Comunicacao.';
COMMENT ON TABLE public.email_events IS 'Eventos recebidos de provedores de e-mail, como delivered, opened, clicked, bounced e complained.';
COMMENT ON TABLE public.email_preferences IS 'Preferencias de recebimento de e-mails por usuario, contato, categoria e canal.';
COMMENT ON TABLE public.email_variables IS 'Catalogo de variaveis disponiveis para renderizacao de templates de e-mail.';

COMMENT ON COLUMN public.email_providers.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_providers.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_providers.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_providers.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_providers.status IS 'Status do registro.';
COMMENT ON COLUMN public.email_providers.config IS 'Configuracoes nao sensiveis do provedor. Chaves secretas devem ficar em variaveis de ambiente.';

COMMENT ON COLUMN public.email_templates.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_templates.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_templates.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_templates.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_templates.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_campaigns.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_campaigns.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_campaigns.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_campaigns.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_campaigns.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_queue.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_queue.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_queue.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_queue.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_queue.status IS 'Status do registro.';
COMMENT ON COLUMN public.email_queue.idempotency_key IS 'Chave de idempotencia para evitar envios duplicados.';

COMMENT ON COLUMN public.email_logs.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_logs.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_logs.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_logs.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_logs.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_events.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_events.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_events.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_events.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_events.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_preferences.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_preferences.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_preferences.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_preferences.created_by IS 'Usuario ou processo que criou o registro.';
COMMENT ON COLUMN public.email_preferences.status IS 'Status do registro.';

COMMENT ON COLUMN public.email_variables.id IS 'Identificador unico do registro.';
COMMENT ON COLUMN public.email_variables.created_at IS 'Data de criacao do registro.';
COMMENT ON COLUMN public.email_variables.updated_at IS 'Data da ultima atualizacao do registro.';
COMMENT ON COLUMN public.email_variables.created_by IS 'Usuario que criou o registro.';
COMMENT ON COLUMN public.email_variables.status IS 'Status do registro.';
