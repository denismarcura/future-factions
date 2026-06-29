import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailPreferenceKey =
  | "novos_desafios"
  | "promocoes"
  | "missoes"
  | "tokens"
  | "convites"
  | "brindes"
  | "eventos"
  | "atualizacoes"
  | "newsletter";

export const EMAIL_PREFERENCE_LABELS: Record<EmailPreferenceKey, string> = {
  novos_desafios: "Novos desafios",
  promocoes: "Promocoes",
  missoes: "Missoes",
  tokens: "Tokens",
  convites: "Convites",
  brindes: "Brindes",
  eventos: "Eventos",
  atualizacoes: "Atualizacoes",
  newsletter: "Newsletter",
};

const preferenceKeys = Object.keys(EMAIL_PREFERENCE_LABELS) as EmailPreferenceKey[];

const segmentSchema = z.object({
  type: z
    .enum([
      "todos",
      "ativos",
      "inativos",
      "nunca_participaram",
      "ja_participaram",
      "criaram_desafios",
      "nunca_criaram",
      "possuem_tokens",
      "poucos_tokens",
      "proximos_premio",
      "sem_login_30",
      "sem_login_60",
      "sem_login_90",
      "cidade",
      "estado",
      "pais",
      "idioma",
      "aceita_promocoes",
      "aceita_missoes",
      "aceita_tokens",
      "aceita_newsletter",
    ])
    .default("todos"),
  value: z.string().trim().max(120).optional(),
  preference: z.enum(preferenceKeys as [EmailPreferenceKey, ...EmailPreferenceKey[]]).optional(),
});

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1).max(160),
  categoria: z.enum([
    "Boas-vindas",
    "Promocao",
    "Novo desafio",
    "Tokens",
    "Missoes",
    "Premios",
    "Newsletter",
    "Institucional",
  ]),
  assunto: z.string().trim().min(1).max(200),
  html: z.string().trim().min(1),
  json_layout: z.array(z.record(z.string(), z.unknown())).default([]),
  status: z.enum(["ativo", "rascunho", "arquivado"]).default("ativo"),
});

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1).max(180),
  assunto: z.string().trim().min(1).max(200),
  template: z.string().uuid().nullable().optional(),
  segmento: segmentSchema.default({ type: "todos" }),
  status: z.enum(["Rascunho", "Agendada", "Enviando", "Finalizada", "Cancelada"]).default("Rascunho"),
  agendamento: z.string().datetime().nullable().optional(),
  remetente: z.string().trim().max(160).nullable().optional(),
  responder_para: z.string().trim().email().nullable().optional(),
});

const preferencesSchema = z.object(
  Object.fromEntries(preferenceKeys.map((key) => [key, z.boolean()])) as Record<
    EmailPreferenceKey,
    z.ZodBoolean
  >,
);

type AnySupabase = any;

async function assertAdmin(context: { supabase: AnySupabase; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
}

function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.VITE_SITE_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function token() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now()}${Math.random()}`.replace(/\D/g, "");
}

async function ensureUnsubscribeToken(sb: AnySupabase, email: string) {
  const normalized = email.toLowerCase().trim();
  const { data: existing } = await sb
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  if (existing?.token) return existing.token as string;

  const next = token();
  const { data, error } = await sb
    .from("email_unsubscribe_tokens")
    .upsert({ email: normalized, token: next }, { onConflict: "email" })
    .select("token")
    .single();
  if (error) throw new Error(error.message);
  return data.token as string;
}

function applyVariables(
  html: string,
  vars: Record<string, unknown>,
  contact: Record<string, unknown>,
) {
  const all: Record<string, unknown> = {
    nome: contact.nome ?? "palpiteiro",
    email: contact.email,
    cidade: contact.cidade ?? "",
    estado: contact.estado ?? "",
    tokens: contact.total_tokens ?? 0,
    creditos: contact.total_creditos ?? 0,
    desafio: vars.desafio ?? "",
    premio: vars.premio ?? "",
    faltam_tokens: vars.faltam_tokens ?? "",
    link: vars.link ?? getSiteUrl(),
    link_preferencias: vars.link_preferencias ?? "",
    link_cancelamento: vars.link_cancelamento ?? "",
    ...vars,
  };

  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => escapeHtml(all[key] ?? ""));
}

function wrapEmailHtml(opts: {
  inner: string;
  subject: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
}) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(
    opts.subject,
  )}</title></head><body style="margin:0;background:#07110c;color:#f8fafc;font-family:Inter,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07110c;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#101a14;border:1px solid #244532;border-radius:18px;overflow:hidden">
        <tr><td style="padding:24px;text-align:center;background:linear-gradient(135deg,#00e676,#ffd700)">
          <div style="color:#07110c;font-weight:900;letter-spacing:2px;font-size:12px">DESAFIO DOS PALPITES</div>
          <div style="color:#07110c;font-weight:900;font-size:24px;margin-top:6px">${escapeHtml(opts.subject)}</div>
        </td></tr>
        <tr><td style="padding:28px;color:#e5e7eb;line-height:1.6;font-size:15px">${opts.inner}</td></tr>
        <tr><td style="padding:18px 24px;border-top:1px solid #244532;color:#9ca3af;font-size:12px;text-align:center">
          <div>Voce recebeu este e-mail porque se cadastrou no Desafio dos Palpites.</div>
          <div style="margin-top:8px">
            <a href="${opts.preferencesUrl}" style="color:#00e676">Alterar preferencias</a>
            <span style="color:#64748b"> | </span>
            <a href="${opts.unsubscribeUrl}" style="color:#ffd700">Cancelar inscricao</a>
            <span style="color:#64748b"> | </span>
            <a href="${getSiteUrl()}/termos" style="color:#cbd5e1">Termos de uso</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

async function createOrUpdateContact(sb: AnySupabase, input: {
  email: string;
  nome?: string | null;
  user_id?: string | null;
  origem?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const { data, error } = await sb
    .from("email_contacts")
    .upsert(
      {
        email,
        nome: input.nome ?? email.split("@")[0],
        user_id: input.user_id ?? null,
        origem: input.origem ?? "Usuario",
        status: "ativo",
      },
      { onConflict: "email" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await sb.from("email_preferences").upsert({ contato_id: data.id }, { onConflict: "contato_id" });
  return data as Record<string, any>;
}

async function selectSegmentContacts(sb: AnySupabase, segment: z.infer<typeof segmentSchema>) {
  let query = sb
    .from("email_contacts")
    .select("*, email_preferences(*)")
    .eq("status", "ativo")
    .order("data_cadastro", { ascending: false });

  if (segment.type === "ativos") query = query.eq("status", "ativo");
  if (segment.type === "inativos") query = query.eq("status", "inativo");
  if (segment.type === "nunca_participaram") query = query.eq("desafios_participados", 0);
  if (segment.type === "ja_participaram") query = query.gt("desafios_participados", 0);
  if (segment.type === "criaram_desafios") query = query.gt("desafios_criados", 0);
  if (segment.type === "nunca_criaram") query = query.eq("desafios_criados", 0);
  if (segment.type === "possuem_tokens") query = query.gt("total_tokens", 0);
  if (segment.type === "poucos_tokens") query = query.lte("total_tokens", 300);
  if (segment.type === "proximos_premio") query = query.gte("total_tokens", 800);
  if (segment.type === "sem_login_30") {
    query = query.or(`ultimo_login.is.null,ultimo_login.lt.${new Date(Date.now() - 30 * 864e5).toISOString()}`);
  }
  if (segment.type === "sem_login_60") {
    query = query.or(`ultimo_login.is.null,ultimo_login.lt.${new Date(Date.now() - 60 * 864e5).toISOString()}`);
  }
  if (segment.type === "sem_login_90") {
    query = query.or(`ultimo_login.is.null,ultimo_login.lt.${new Date(Date.now() - 90 * 864e5).toISOString()}`);
  }
  if (segment.type === "cidade" && segment.value) query = query.ilike("cidade", segment.value);
  if (segment.type === "estado" && segment.value) query = query.ilike("estado", segment.value);
  if (segment.type === "pais" && segment.value) query = query.ilike("pais", segment.value);
  if (segment.type === "idioma" && segment.value) query = query.ilike("idioma", segment.value);

  const { data, error } = await query.limit(5000);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<Record<string, any>>;
  const prefByType: Partial<Record<typeof segment.type, EmailPreferenceKey>> = {
    aceita_promocoes: "promocoes",
    aceita_missoes: "missoes",
    aceita_tokens: "tokens",
    aceita_newsletter: "newsletter",
  };
  const requiredPref = segment.preference ?? prefByType[segment.type];

  return requiredPref
    ? rows.filter((r) => r.email_preferences?.[requiredPref] !== false)
    : rows;
}

function metricPct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export const listEmailMarketingData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;

    const [contactsRes, templatesRes, campaignsRes, logsRes, queueRes] = await Promise.all([
      sb.from("email_contacts").select("*, email_preferences(*)").order("data_cadastro", { ascending: false }).limit(400),
      sb.from("email_templates").select("*").order("atualizado_em", { ascending: false }).limit(100),
      sb.from("email_campaigns").select("*, email_templates(nome,categoria)").order("criado_em", { ascending: false }).limit(100),
      sb.from("email_campaign_logs").select("*, email_campaigns(nome, assunto)").order("data", { ascending: false }).limit(1000),
      sb.from("email_queue").select("*").order("criado_em", { ascending: false }).limit(200),
    ]);

    for (const res of [contactsRes, templatesRes, campaignsRes, logsRes, queueRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const contacts = contactsRes.data ?? [];
    const logs = logsRes.data ?? [];
    const sent = logs.filter((l: any) => l.enviado).length;
    const opened = logs.filter((l: any) => l.aberto).length;
    const clicked = logs.filter((l: any) => l.clicado).length;
    const optOut = contacts.filter((c: any) => c.status === "opt-out").length;
    const bounce = contacts.filter((c: any) => c.status === "bounce").length;
    const spam = contacts.filter((c: any) => c.status === "spam").length;

    const campaignMap = new Map<string, any>();
    for (const log of logs as any[]) {
      const id = log.campanha ?? "sem-campanha";
      const current = campaignMap.get(id) ?? {
        id,
        name: log.email_campaigns?.nome ?? "Campanha",
        sent: 0,
        opened: 0,
        clicked: 0,
      };
      if (log.enviado) current.sent += 1;
      if (log.aberto) current.opened += 1;
      if (log.clicado) current.clicked += 1;
      campaignMap.set(id, current);
    }

    const monthly = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const key = date.toISOString().slice(0, 7);
      const monthLogs = logs.filter((l: any) => String(l.data).startsWith(key));
      return {
        month: key,
        enviados: monthLogs.filter((l: any) => l.enviado).length,
        abertos: monthLogs.filter((l: any) => l.aberto).length,
        cliques: monthLogs.filter((l: any) => l.clicado).length,
      };
    });

    return {
      stats: {
        totalContacts: contacts.length,
        active: contacts.filter((c: any) => c.status === "ativo").length,
        optOut,
        bounce,
        spam,
        campaigns: campaignsRes.data?.length ?? 0,
        sent,
        opened,
        clicked,
        ctr: metricPct(clicked, sent),
        ctor: metricPct(clicked, opened),
      },
      monthly,
      topCampaigns: Array.from(campaignMap.values())
        .map((c) => ({ ...c, ctr: metricPct(c.clicked, c.sent) }))
        .sort((a, b) => b.clicked - a.clicked)
        .slice(0, 8),
      contacts,
      templates: templatesRes.data ?? [],
      campaigns: campaignsRes.data ?? [],
      logs,
      queue: queueRes.data ?? [],
    };
  });

export const syncEmailContactsFromProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const { data, error } = await sb
      .from("profiles")
      .select("id, full_name, email, whatsapp, cidade, estado, signup_city, status, welcome_bonus, palpite_credits, created_at")
      .not("email", "is", null)
      .limit(5000);
    if (error) throw new Error(error.message);

    let count = 0;
    for (const profile of data ?? []) {
      await createOrUpdateContact(sb, {
        user_id: profile.id,
        email: profile.email,
        nome: profile.full_name,
        origem: "Usuario",
      });
      await sb
        .from("email_contacts")
        .update({
          telefone: profile.whatsapp,
          cidade: profile.cidade ?? profile.signup_city,
          estado: profile.estado,
          total_tokens: profile.welcome_bonus ?? 0,
          total_creditos: profile.palpite_credits ?? 0,
          data_cadastro: profile.created_at,
          status: profile.status === "inactive" ? "inativo" : "ativo",
        })
        .eq("email", String(profile.email).toLowerCase());
      count += 1;
    }
    return { ok: true, count };
  });

export const upsertEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => templateSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const payload = { ...data, atualizado_em: new Date().toISOString() };
    const { data: row, error } = data.id
      ? await sb.from("email_templates").update(payload).eq("id", data.id).select("*").single()
      : await sb.from("email_templates").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertEmailCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => campaignSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const payload = {
      ...data,
      criado_por: context.userId,
      atualizado_em: new Date().toISOString(),
    };
    const { data: row, error } = data.id
      ? await sb.from("email_campaigns").update(payload).eq("id", data.id).select("*").single()
      : await sb.from("email_campaigns").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const enqueueEmailCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ campaignId: z.string().uuid(), sendNow: z.boolean().default(true) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const { data: campaign, error: cErr } = await sb
      .from("email_campaigns")
      .select("*, email_templates(*)")
      .eq("id", data.campaignId)
      .single();
    if (cErr) throw new Error(cErr.message);
    if (!campaign.email_templates) throw new Error("Campanha sem template.");

    const contacts = await selectSegmentContacts(sb, segmentSchema.parse(campaign.segmento ?? { type: "todos" }));
    const now = new Date().toISOString();
    let queued = 0;
    let skipped = 0;

    await sb.from("email_campaigns").update({ status: "Enviando", data_envio: now }).eq("id", campaign.id);

    for (const contact of contacts) {
      const email = String(contact.email ?? "").toLowerCase().trim();
      if (!email) {
        skipped += 1;
        continue;
      }

      const { data: recent } = await sb
        .from("email_campaign_logs")
        .select("id")
        .eq("contato", contact.id)
        .eq("enviado", true)
        .gte("data", new Date(Date.now() - 7 * 864e5).toISOString())
        .limit(1);
      if (recent?.length) {
        skipped += 1;
        continue;
      }

      const unsubToken = await ensureUnsubscribeToken(sb, email);
      const preferencesUrl = `${getSiteUrl()}/email-preferencias?token=${encodeURIComponent(unsubToken)}`;
      const unsubscribeUrl = `${getSiteUrl()}/email-cancelar?token=${encodeURIComponent(unsubToken)}`;
      const messageId = `marketing:${campaign.id}:${contact.id}`;
      const inner = applyVariables(
        campaign.email_templates.html,
        { link_preferencias: preferencesUrl, link_cancelamento: unsubscribeUrl },
        contact,
      );
      const html = wrapEmailHtml({
        inner,
        subject: campaign.assunto,
        preferencesUrl,
        unsubscribeUrl,
      });

      await sb.from("email_queue").upsert(
        {
          campanha: campaign.id,
          contato: contact.id,
          status: "enfileirado",
          data_execucao: campaign.agendamento ?? now,
          message_id: messageId,
        },
        { onConflict: "campanha,contato" },
      );
      await sb.from("email_campaign_logs").upsert(
        {
          campanha: campaign.id,
          contato: contact.id,
          message_id: messageId,
          enviado: false,
          ultimo_evento: "queued",
          metadata: { email },
        },
        { onConflict: "campanha,contato" },
      );

      const { error: qErr } = await sb.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          idempotency_key: messageId,
          to: email,
          from: campaign.remetente ?? undefined,
          subject: campaign.assunto,
          html,
          label: "email_marketing",
          purpose: "transactional",
          unsubscribe_token: unsubToken,
          queued_at: now,
          metadata: { campaign_id: campaign.id, contact_id: contact.id },
        },
      });

      if (qErr) {
        await sb
          .from("email_queue")
          .update({ status: "erro", erro: qErr.message, tentativas: 1 })
          .eq("campanha", campaign.id)
          .eq("contato", contact.id);
        skipped += 1;
      } else {
        queued += 1;
      }
    }

    await sb
      .from("email_campaigns")
      .update({ status: queued > 0 ? "Finalizada" : "Rascunho", data_envio: now })
      .eq("id", campaign.id);

    return { ok: true, queued, skipped, total: contacts.length };
  });

export const sendPreferenceRequestEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().email(), nome: z.string().max(160).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const contact = await createOrUpdateContact(sb, {
      email: data.email,
      nome: data.nome,
      origem: "Usuario",
    });

    const { data: recent } = await sb
      .from("email_send_log")
      .select("id")
      .eq("recipient_email", contact.email)
      .eq("template_name", "email_preferences_request")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);
    if (recent?.length) return { ok: true, skipped: "recently_sent" as const };

    const unsubToken = await ensureUnsubscribeToken(sb, contact.email);
    const preferencesUrl = `${getSiteUrl()}/email-preferencias?token=${encodeURIComponent(unsubToken)}`;
    const unsubscribeUrl = `${getSiteUrl()}/email-cancelar?token=${encodeURIComponent(unsubToken)}`;
    const subject = "Escolha quais comunicacoes deseja receber";
    const html = wrapEmailHtml({
      subject,
      preferencesUrl,
      unsubscribeUrl,
      inner: `<p>Oi, <strong>${escapeHtml(contact.nome ?? "palpiteiro")}</strong>.</p>
      <p>Seu cadastro no Desafio dos Palpites foi recebido. Agora escolha quais comunicacoes voce quer receber: desafios, tokens, missoes, premios, eventos e newsletter.</p>
      <p style="text-align:center;margin:28px 0"><a href="${preferencesUrl}" style="display:inline-block;background:linear-gradient(135deg,#00e676,#ffd700);color:#07110c;text-decoration:none;font-weight:900;padding:14px 24px;border-radius:999px">Definir minhas preferencias</a></p>`,
    });
    const messageId = `preferences:${contact.id}:${Date.now()}`;
    const { error } = await sb.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        idempotency_key: messageId,
        to: contact.email,
        subject,
        html,
        label: "email_preferences_request",
        purpose: "transactional",
        unsubscribe_token: unsubToken,
        queued_at: new Date().toISOString(),
      },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getEmailPreferencesByToken = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const { data: tokenRow, error: tokenErr } = await sb
      .from("email_unsubscribe_tokens")
      .select("email")
      .eq("token", data.token)
      .maybeSingle();
    if (tokenErr) throw new Error(tokenErr.message);
    if (!tokenRow?.email) return null;

    const { data: contact, error } = await sb
      .from("email_contacts")
      .select("*, email_preferences(*)")
      .eq("email", tokenRow.email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return contact;
  });

export const saveEmailPreferencesByToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        preferences: preferencesSchema,
        optOut: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const { contact } = await getContactByToken(sb, data.token);
    if (!contact) return { ok: false, reason: "not_found" as const };

    await sb
      .from("email_preferences")
      .upsert({ contato_id: contact.id, ...data.preferences }, { onConflict: "contato_id" });
    await sb
      .from("email_contacts")
      .update({ status: data.optOut ? "opt-out" : "ativo" })
      .eq("id", contact.id);

    if (data.optOut) {
      await sb
        .from("suppressed_emails")
        .upsert({ email: contact.email, reason: "unsubscribe", metadata: { source: "preferences" } }, { onConflict: "email" });
    }
    return { ok: true };
  });

async function getContactByToken(sb: AnySupabase, rawToken: string) {
  const { data: tokenRow, error: tokenErr } = await sb
    .from("email_unsubscribe_tokens")
    .select("email")
    .eq("token", rawToken)
    .maybeSingle();
  if (tokenErr) throw new Error(tokenErr.message);
  if (!tokenRow?.email) return { contact: null };
  const { data: contact, error } = await sb
    .from("email_contacts")
    .select("*")
    .eq("email", tokenRow.email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { contact };
}

export const unsubscribeEmailByToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as AnySupabase;
    const { contact } = await getContactByToken(sb, data.token);
    if (!contact) return { ok: false, reason: "not_found" as const };
    await sb.from("email_contacts").update({ status: "opt-out" }).eq("id", contact.id);
    await sb.from("email_preferences").upsert(
      Object.fromEntries([
        ["contato_id", contact.id],
        ...preferenceKeys.map((key) => [key, false]),
      ]),
      { onConflict: "contato_id" },
    );
    await sb
      .from("suppressed_emails")
      .upsert({ email: contact.email, reason: "unsubscribe", metadata: { source: "unsubscribe_page" } }, { onConflict: "email" });
    await sb.from("email_unsubscribe_tokens").update({ used_at: new Date().toISOString() }).eq("token", data.token);
    return { ok: true };
  });

export async function recordResendWebhook(payload: unknown) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb = supabaseAdmin as AnySupabase;
  const event = payload as any;
  const eventType = String(event?.type ?? event?.event ?? event?.data?.type ?? "unknown");
  const data = event?.data ?? event;
  const messageId = String(data?.email_id ?? data?.message_id ?? data?.id ?? "");
  const recipient = String(data?.to?.[0] ?? data?.to ?? data?.recipient ?? "").toLowerCase();

  let campaignId: string | null = null;
  let contactId: string | null = null;
  if (messageId.startsWith("marketing:")) {
    const [, campaign, contact] = messageId.split(":");
    campaignId = campaign || null;
    contactId = contact || null;
  } else if (recipient) {
    const { data: contact } = await sb.from("email_contacts").select("id").eq("email", recipient).maybeSingle();
    contactId = contact?.id ?? null;
  }

  await sb.from("email_events").insert({
    provider: "resend",
    event_type: eventType,
    message_id: messageId || null,
    campanha: campaignId,
    contato: contactId,
    payload: event,
  });

  const patch: Record<string, unknown> = {
    ultimo_evento: eventType,
    data: new Date().toISOString(),
  };
  if (/sent/i.test(eventType)) patch.enviado = true;
  if (/delivered/i.test(eventType)) patch.entregue = true;
  if (/open/i.test(eventType)) patch.aberto = true;
  if (/click/i.test(eventType)) patch.clicado = true;
  if (/bounce|failed/i.test(eventType)) patch.bounce = true;
  if (/complaint|spam/i.test(eventType)) patch.spam = true;
  if (/unsubscribe/i.test(eventType)) patch.cancelou = true;

  if (messageId) {
    await sb.from("email_campaign_logs").update(patch).eq("message_id", messageId);
    if (patch.enviado) await sb.from("email_queue").update({ status: "enviado" }).eq("message_id", messageId);
  }

  if (recipient && (patch.bounce || patch.spam || patch.cancelou)) {
    const status = patch.bounce ? "bounce" : patch.spam ? "spam" : "opt-out";
    await sb.from("email_contacts").update({ status }).eq("email", recipient);
    await sb.from("suppressed_emails").upsert(
      {
        email: recipient,
        reason: patch.bounce ? "bounce" : patch.spam ? "complaint" : "unsubscribe",
        metadata: event,
      },
      { onConflict: "email" },
    );
  }

  return { ok: true };
}
