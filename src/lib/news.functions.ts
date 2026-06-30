import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { z } from "zod";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

// ============== Public reads ==============

export const listNews = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(6),
        categorySlug: z.string().optional(),
        lastHourOnly: z.boolean().optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = sb
      .from("news_articles")
      .select(
        "id, title, slug, summary, cover_url, published_at, category_id, tags, news_categories(name, slug)",
        { count: "exact" },
      )
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (data.lastHourOnly) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      q = q.gte("published_at", since);
    }
    if (data.categorySlug) {
      const { data: cat } = await sb
        .from("news_categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [], total: count ?? 0 };
  });

export const getNewsBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: article, error } = await sb
      .from("news_articles")
      .select(
        "*, news_categories(name, slug), news_subcategories(name, slug)",
      )
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!article) return null;

    // Ratings aggregate
    const { data: ratings } = await sb
      .from("news_ratings")
      .select("rating")
      .eq("article_id", article.id);
    const count = ratings?.length ?? 0;
    const avg = count > 0 ? (ratings!.reduce((s, r) => s + r.rating, 0) / count) : 0;

    // Related challenges (if linked)
    let related: any[] = [];
    if (article.related_challenge_ids?.length) {
      const { data: ch } = await sb
        .from("challenges")
        .select("id, title, slug, cover_url, deadline_at")
        .in("id", article.related_challenge_ids);
      related = ch ?? [];
    }
    // Same-category news suggestions (latest 4)
    const { data: more } = await sb
      .from("news_articles")
      .select("id, title, slug, cover_url, published_at")
      .eq("published", true)
      .eq("category_id", article.category_id ?? "00000000-0000-0000-0000-000000000000")
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(4);

    return {
      article,
      rating: { avg, count },
      relatedChallenges: related,
      moreNews: more ?? [],
    };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data: cats } = await sb.from("news_categories").select("*").order("name");
  const { data: subs } = await sb.from("news_subcategories").select("*").order("name");
  return { categories: cats ?? [], subcategories: subs ?? [] };
});

// ============== Authenticated user actions ==============

export const rateNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ articleId: z.string().uuid(), rating: z.number().int().min(1).max(5) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("news_ratings")
      .upsert(
        { article_id: data.articleId, user_id: context.userId, rating: data.rating },
        { onConflict: "article_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitInstagramShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ articleId: z.string().uuid(), instagramUrl: z.string().url() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("news_instagram_shares")
      .upsert(
        {
          article_id: data.articleId,
          user_id: context.userId,
          instagram_url: data.instagramUrl,
          status: "pending",
        },
        { onConflict: "article_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============== Admin ==============

export const adminListNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("news_articles")
      .select("id, title, slug, published, auto_generated, published_at, created_at, category_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const SaveInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  summary: z.string().optional().nullable(),
  body: z.string().min(10),
  cover_url: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_keywords: z.string().optional().nullable(),
  related_challenge_ids: z.array(z.string().uuid()).optional(),
  published: z.boolean().optional(),
  auto_generated: z.boolean().optional(),
});

export const saveNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SaveInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const slug = slugify(data.title) + "-" + Math.random().toString(36).slice(2, 6);
    const payload: any = {
      title: data.title,
      summary: data.summary ?? null,
      body: data.body,
      cover_url: data.cover_url ?? null,
      source_url: data.source_url ?? null,
      category_id: data.category_id ?? null,
      subcategory_id: data.subcategory_id ?? null,
      tags: data.tags ?? [],
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      seo_keywords: data.seo_keywords ?? null,
      related_challenge_ids: data.related_challenge_ids ?? [],
      published: data.published ?? false,
      auto_generated: data.auto_generated ?? false,
      author_id: context.userId,
    };
    if (data.published) payload.published_at = new Date().toISOString();

    if (data.id) {
      const { error } = await context.supabase.from("news_articles").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    payload.slug = slug;
    const { data: row, error } = await context.supabase
      .from("news_articles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("news_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ name: z.string().min(2), parentCategoryId: z.string().uuid().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const slug = slugify(data.name);
    if (data.parentCategoryId) {
      const { error } = await context.supabase
        .from("news_subcategories")
        .insert({ name: data.name, slug, category_id: data.parentCategoryId });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("news_categories")
        .insert({ name: data.name, slug });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ============== AI: generate news with SEO ==============

export const generateNewsArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(3),
        referenceUrl: z.string().url().optional().or(z.literal("")),
        category: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = createAiTextModel();

    const prompt = `Você é um jornalista e especialista em SEO. Escreva um artigo de notícia em português brasileiro sobre:

TÍTULO: "${data.title}"
${data.category ? `CATEGORIA: ${data.category}` : ""}
${data.referenceUrl ? `REFERÊNCIA (notícia parecida para inspiração — NÃO copiar): ${data.referenceUrl}` : ""}

REGRAS DE SEO:
- Use o título principal como H1 (a primeira linha sem markdown)
- Crie um resumo (meta description) de 140-160 caracteres atraente
- Use subtítulos H2 e H3 ao longo do texto
- Texto de 400-700 palavras, parágrafos curtos, escaneável
- Inclua palavras-chave naturais relacionadas ao tema
- Termine com uma conclusão e CTA leve
- Liste 5-8 palavras-chave SEO separadas por vírgula

RETORNE EXATAMENTE NO FORMATO JSON (sem cercas de código):
{
  "seo_title": "título otimizado até 60 caracteres",
  "seo_description": "meta description 140-160 caracteres",
  "seo_keywords": "palavra1, palavra2, ...",
  "summary": "resumo curto 1-2 frases para listagens",
  "body": "texto completo em markdown",
  "tags": ["tag1","tag2","tag3"]
}`;

    const { text } = await generateText({
      model,
      prompt,
    });

    // Extract JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta IA inválida");
    const parsed = JSON.parse(match[0]);
    return parsed as {
      seo_title: string;
      seo_description: string;
      seo_keywords: string;
      summary: string;
      body: string;
      tags: string[];
    };
  });

export const generateNewsImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prompt: z.string().min(3) }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { generateAiImage } = await import("./ai-gateway.server");
    const dataUrl = await generateAiImage({
      prompt: `Imagem editorial 16:9 para um artigo de notícia: ${data.prompt}. Estilo fotojornalístico, alta qualidade, sem texto sobreposto.`,
    });
    return { dataUrl };
  });

// ============== Auto-post (admin trigger) ==============

export const aiAutoPostNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ theme: z.string().min(3), publishNow: z.boolean().default(true) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = createAiTextModel();

    // 1) ask AI for a fresh headline
    const titleRes = await generateText({
      model,
      prompt: `Crie UM título de notícia em português brasileiro, atual, sobre o tema: "${data.theme}". Responda APENAS o título, sem aspas.`,
    });
    const title = titleRes.text.trim().replace(/^"|"$/g, "").slice(0, 140);

    // 2) generate body
    const bodyRes = await generateText({
      model,
      prompt: `Escreva uma notícia em PT-BR (400-600 palavras) sobre: "${title}". Markdown com H2/H3. Retorne JSON:
{"seo_title":"...","seo_description":"...","seo_keywords":"...","summary":"...","body":"...","tags":["..."]}`,
    });
    const m = bodyRes.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("IA não retornou JSON");
    const parsed = JSON.parse(m[0]);

    const slug = slugify(title) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: row, error } = await context.supabase
      .from("news_articles")
      .insert({
        title,
        slug,
        summary: parsed.summary ?? null,
        body: parsed.body ?? "",
        seo_title: parsed.seo_title ?? title,
        seo_description: parsed.seo_description ?? null,
        seo_keywords: parsed.seo_keywords ?? null,
        tags: parsed.tags ?? [],
        published: data.publishNow,
        published_at: data.publishNow ? new Date().toISOString() : null,
        auto_generated: true,
        author_id: context.userId,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ============== Admin: instagram share review ==============

export const adminListShares = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("news_instagram_shares")
      .select("*, news_articles(title, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reviewInstagramShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const tokens = data.approve ? 50 : 0;
    const { data: share, error } = await context.supabase
      .from("news_instagram_shares")
      .update({
        status: data.approve ? "approved" : "rejected",
        tokens_awarded: tokens,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("user_id, article_id")
      .single();
    if (error) throw new Error(error.message);

    if (data.approve && share) {
      await context.supabase.from("token_transactions").insert({
        user_id: share.user_id,
        delta: tokens,
        reason: "Compartilhamento de notícia no Instagram",
      });
    }
    return { ok: true };
  });
