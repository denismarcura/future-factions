-- Complete e-mail marketing model built on top of the existing Resend/Lovable
-- queue infrastructure. Idempotent by design so it can be applied safely.

CREATE TABLE IF NOT EXISTS public.email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT NOT NULL DEFAULT 'BR',
  idioma TEXT NOT NULL DEFAULT 'pt-BR',
  origem TEXT NOT NULL DEFAULT 'Usuario',
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'opt-out', 'bounce', 'spam')),
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_login TIMESTAMPTZ,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_creditos INTEGER NOT NULL DEFAULT 0,
  desafios_criados INTEGER NOT NULL DEFAULT 0,
  desafios_participados INTEGER NOT NULL DEFAULT 0,
  convites_realizados INTEGER NOT NULL DEFAULT 0,
  ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.email_preferences (
  contato_id UUID PRIMARY KEY REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  novos_desafios BOOLEAN NOT NULL DEFAULT true,
  promocoes BOOLEAN NOT NULL DEFAULT true,
  missoes BOOLEAN NOT NULL DEFAULT true,
  tokens BOOLEAN NOT NULL DEFAULT true,
  convites BOOLEAN NOT NULL DEFAULT true,
  brindes BOOLEAN NOT NULL DEFAULT true,
  eventos BOOLEAN NOT NULL DEFAULT true,
  atualizacoes BOOLEAN NOT NULL DEFAULT true,
  newsletter BOOLEAN NOT NULL DEFAULT true,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (
    categoria IN (
      'Boas-vindas',
      'Promocao',
      'Novo desafio',
      'Tokens',
      'Missoes',
      'Premios',
      'Newsletter',
      'Institucional'
    )
  ),
  assunto TEXT NOT NULL,
  html TEXT NOT NULL,
  json_layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'rascunho', 'arquivado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  template UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  segmento JSONB NOT NULL DEFAULT '{"type":"todos"}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Rascunho'
    CHECK (status IN ('Rascunho', 'Agendada', 'Enviando', 'Finalizada', 'Cancelada')),
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agendamento TIMESTAMPTZ,
  data_envio TIMESTAMPTZ,
  remetente TEXT,
  responder_para TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contato UUID REFERENCES public.email_contacts(id) ON DELETE SET NULL,
  message_id TEXT,
  enviado BOOLEAN NOT NULL DEFAULT false,
  entregue BOOLEAN NOT NULL DEFAULT false,
  aberto BOOLEAN NOT NULL DEFAULT false,
  clicado BOOLEAN NOT NULL DEFAULT false,
  bounce BOOLEAN NOT NULL DEFAULT false,
  spam BOOLEAN NOT NULL DEFAULT false,
  cancelou BOOLEAN NOT NULL DEFAULT false,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_evento TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (campanha, contato)
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'resend',
  event_type TEXT NOT NULL,
  message_id TEXT,
  campanha UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  contato UUID REFERENCES public.email_contacts(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  recebido_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contato UUID REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enfileirado', 'enviado', 'erro', 'cancelado', 'suprimido')),
  tentativas INTEGER NOT NULL DEFAULT 0,
  data_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_id TEXT,
  erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha, contato)
);

CREATE INDEX IF NOT EXISTS idx_email_contacts_status ON public.email_contacts(status);
CREATE INDEX IF NOT EXISTS idx_email_contacts_user ON public.email_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_location ON public.email_contacts(cidade, estado, pais);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_message ON public.email_campaign_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_message ON public.email_events(message_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_exec ON public.email_queue(status, data_execucao);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaign_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO service_role;

ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage email contacts" ON public.email_contacts
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own email contact" ON public.email_contacts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email preferences" ON public.email_preferences
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own email preferences" ON public.email_preferences
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.email_contacts c
        WHERE c.id = contato_id AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email templates" ON public.email_templates
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage email campaigns" ON public.email_campaigns
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read email campaign logs" ON public.email_campaign_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read email events" ON public.email_events
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read email queue" ON public.email_queue
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email contacts" ON public.email_contacts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email preferences" ON public.email_preferences
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email templates" ON public.email_templates
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email campaigns" ON public.email_campaigns
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email campaign logs" ON public.email_campaign_logs
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email events" ON public.email_events
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages email queue" ON public.email_queue
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.touch_email_marketing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'email_contacts' THEN
    NEW.ultima_atualizacao = now();
  ELSIF TG_TABLE_NAME = 'email_preferences' THEN
    NEW.atualizado_em = now();
  ELSIF TG_TABLE_NAME = 'email_templates' THEN
    NEW.atualizado_em = now();
  ELSIF TG_TABLE_NAME = 'email_campaigns' THEN
    NEW.atualizado_em = now();
  ELSIF TG_TABLE_NAME = 'email_queue' THEN
    NEW.atualizado_em = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_contacts_touch ON public.email_contacts;
CREATE TRIGGER trg_email_contacts_touch
  BEFORE UPDATE ON public.email_contacts
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_preferences_touch ON public.email_preferences;
CREATE TRIGGER trg_email_preferences_touch
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_templates_touch ON public.email_templates;
CREATE TRIGGER trg_email_templates_touch
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_campaigns_touch ON public.email_campaigns;
CREATE TRIGGER trg_email_campaigns_touch
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_queue_touch ON public.email_queue;
CREATE TRIGGER trg_email_queue_touch
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_marketing_updated_at();

CREATE OR REPLACE FUNCTION public.sync_profile_to_email_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_id UUID;
BEGIN
  IF NEW.email IS NULL OR length(trim(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.email_contacts (
    user_id,
    nome,
    email,
    telefone,
    cidade,
    estado,
    pais,
    idioma,
    origem,
    status,
    data_cadastro,
    ultimo_login,
    total_tokens,
    total_creditos
  )
  VALUES (
    NEW.id,
    NEW.full_name,
    lower(trim(NEW.email)),
    NEW.whatsapp,
    COALESCE(NEW.cidade, NEW.signup_city),
    NEW.estado,
    'BR',
    'pt-BR',
    'Usuario',
    CASE WHEN NEW.status = 'inactive' THEN 'inativo' ELSE 'ativo' END,
    COALESCE(NEW.created_at, now()),
    now(),
    COALESCE(NEW.welcome_bonus, 0),
    COALESCE(NEW.palpite_credits, 0)
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, public.email_contacts.user_id),
    nome = COALESCE(EXCLUDED.nome, public.email_contacts.nome),
    telefone = COALESCE(EXCLUDED.telefone, public.email_contacts.telefone),
    cidade = COALESCE(EXCLUDED.cidade, public.email_contacts.cidade),
    estado = COALESCE(EXCLUDED.estado, public.email_contacts.estado),
    ultimo_login = now(),
    total_tokens = EXCLUDED.total_tokens,
    total_creditos = EXCLUDED.total_creditos,
    status = CASE
      WHEN public.email_contacts.status IN ('opt-out', 'bounce', 'spam') THEN public.email_contacts.status
      ELSE EXCLUDED.status
    END,
    ultima_atualizacao = now()
  RETURNING id INTO contact_id;

  INSERT INTO public.email_preferences (contato_id)
  VALUES (contact_id)
  ON CONFLICT (contato_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_email_contact_insert ON public.profiles;
CREATE TRIGGER trg_profiles_email_contact_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_email_contact();

DROP TRIGGER IF EXISTS trg_profiles_email_contact_update ON public.profiles;
CREATE TRIGGER trg_profiles_email_contact_update
  AFTER UPDATE OF full_name, email, whatsapp, cidade, estado, signup_city, status, welcome_bonus, palpite_credits
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_email_contact();

INSERT INTO public.email_templates (nome, categoria, assunto, html, json_layout, status)
VALUES (
  'Preferencias de comunicacao',
  'Institucional',
  'Escolha quais comunicacoes deseja receber',
  '<h1>Oi, {{nome}}!</h1><p>Queremos enviar apenas o que importa para voce no Desafio dos Palpites.</p><p><a href="{{link_preferencias}}">Atualizar minhas preferencias</a></p>',
  '[{"type":"logo"},{"type":"text","content":"Oi, {{nome}}!"},{"type":"button","label":"Atualizar preferencias","href":"{{link_preferencias}}"},{"type":"footer"}]'::jsonb,
  'ativo'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates (nome, categoria, assunto, html, json_layout, status)
VALUES (
  'Newsletter semanal',
  'Newsletter',
  'Novidades do Desafio dos Palpites',
  '<h1>Novidades para voce, {{nome}}</h1><p>Veja desafios, missoes e premios em destaque.</p><p><a href="{{link}}">Abrir o Desafio dos Palpites</a></p>',
  '[{"type":"logo"},{"type":"banner","content":"Novidades da semana"},{"type":"cards"},{"type":"button","label":"Participar agora","href":"{{link}}"},{"type":"footer"}]'::jsonb,
  'ativo'
)
ON CONFLICT DO NOTHING;
