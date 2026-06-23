import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Newspaper, Star, Share2, MessageCircle, Instagram, Facebook, Twitter,
  Copy, Loader2, Trophy, Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getNewsBySlug, listNews, rateNews, submitInstagramShare } from "@/lib/news.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/noticias/$slug")({
  loader: async ({ params }) => {
    const fn = getNewsBySlug as any;
    const data = await fn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "Notícia" }] };
    return {
      meta: [
        { title: a.seo_title || a.title },
        { name: "description", content: a.seo_description || a.summary || "" },
        { name: "keywords", content: a.seo_keywords || "" },
        { property: "og:title", content: a.seo_title || a.title },
        { property: "og:description", content: a.seo_description || a.summary || "" },
        { property: "og:image", content: a.cover_url || "" },
        { property: "og:type", content: "article" },
      ],
    };
  },
  errorComponent: () => <div className="p-8">Erro ao carregar.</div>,
  notFoundComponent: () => <div className="p-8">Notícia não encontrada.</div>,
  component: NewsDetail,
});

function NewsDetail() {
  const data = Route.useLoaderData() as any;
  const { article, rating, relatedChallenges, moreNews } = data;
  const { user } = useAuth();
  const rate = useServerFn(rateNews);
  const submitShare = useServerFn(submitInstagramShare);
  const listFn = useServerFn(listNews);

  const [latest, setLatest] = useState<any[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [igUrl, setIgUrl] = useState("");
  const [shareBusy, setShareBusy] = useState(false);

  useEffect(() => {
    listFn({ data: { page: 1, pageSize: 8 } }).then((r) => setLatest(r.items.filter((x: any) => x.id !== article.id)));
  }, [article.id]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(article.title);

  async function handleRate(n: number) {
    if (!user) return toast.error("Faça login para avaliar");
    setMyRating(n);
    try {
      await rate({ data: { articleId: article.id, rating: n } });
      toast.success("Obrigado pela avaliação!");
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleSubmitShare() {
    if (!user) return toast.error("Faça login");
    if (!igUrl.startsWith("http")) return toast.error("Cole o link do seu post");
    setShareBusy(true);
    try {
      await submitShare({ data: { articleId: article.id, instagramUrl: igUrl } });
      toast.success("Enviado! Após aprovação você ganhará 50 tokens.");
      setIgUrl("");
    } catch (e: any) { toast.error(e.message); } finally { setShareBusy(false); }
  }

  return (
    <AppShell>
      <article className="max-w-4xl mx-auto py-4 space-y-6">
        {article.news_categories?.name && (
          <Link to="/noticias" className="text-xs font-bold uppercase text-primary">{article.news_categories.name}</Link>
        )}
        <h1 className="text-3xl md:text-4xl font-display font-black leading-tight">{article.title}</h1>
        {article.summary && <p className="text-lg text-muted-foreground">{article.summary}</p>}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {article.published_at && new Date(article.published_at).toLocaleString("pt-BR")}
        </div>

        {article.cover_url && (
          <img src={article.cover_url} alt={article.title} className="w-full rounded-2xl aspect-video object-cover" />
        )}

        {/* Body markdown rendered as simple HTML */}
        <div className="prose prose-invert max-w-none text-base leading-relaxed whitespace-pre-wrap">
          {article.body}
        </div>

        {article.source_url && (
          <a href={article.source_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Fonte original</a>
        )}

        {/* Compartilhar */}
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Share2 className="h-4 w-4" /> Compartilhar</h3>
          <div className="flex flex-wrap gap-2">
            <a href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="h-10 px-4 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="h-10 px-4 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-bold flex items-center gap-2"><Facebook className="h-4 w-4" />Facebook</a>
            <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="h-10 px-4 rounded-lg bg-sky-500/10 text-sky-500 text-sm font-bold flex items-center gap-2"><Twitter className="h-4 w-4" />Twitter/X</a>
            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copiado"); }} className="h-10 px-4 rounded-lg glass-card border border-border/60 text-sm font-bold flex items-center gap-2"><Copy className="h-4 w-4" />Copiar link</button>
          </div>
        </section>

        {/* Avaliação */}
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold mb-3">Avalie esta notícia</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => handleRate(i)}>
                <Star className={`h-7 w-7 ${i <= (myRating || Math.round(rating.avg)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Média: {rating.avg.toFixed(1)} ({rating.count} avaliação{rating.count !== 1 ? "es" : ""})
          </div>
        </section>

        {/* Instagram bonus */}
        <section className="glass-card rounded-2xl p-5 border border-pink-500/30">
          <h3 className="font-bold mb-2 flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-500" /> Compartilhe no Instagram e ganhe 50 tokens</h3>
          <p className="text-xs text-muted-foreground mb-3">Publique esta notícia no seu Instagram e cole o link do post abaixo. Após aprovação, você recebe 50 tokens.</p>
          <div className="flex gap-2">
            <input value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder="https://instagram.com/p/..." className="flex-1 h-10 px-3 rounded-lg bg-muted/40 border border-border/60 text-sm" />
            <button onClick={handleSubmitShare} disabled={shareBusy} className="h-10 px-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60">
              {shareBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
              Enviar
            </button>
          </div>
        </section>

        {/* Desafios relacionados */}
        {relatedChallenges.length > 0 && (
          <section>
            <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4" /> Desafios relacionados</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedChallenges.map((c: any) => (
                <Link key={c.id} to="/previsao/$id" params={{ id: c.id }} className="glass-card rounded-xl overflow-hidden border border-border/60 hover:border-primary/60">
                  {c.cover_url && <img src={c.cover_url} className="w-full aspect-video object-cover" alt="" />}
                  <div className="p-3"><div className="font-bold text-sm line-clamp-2">{c.title}</div></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Notícias relacionadas */}
        {moreNews.length > 0 && (
          <section>
            <h3 className="font-bold mb-3">Continue lendo</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {moreNews.map((n: any) => (
                <Link key={n.id} to="/noticias/$slug" params={{ slug: n.slug }} className="flex gap-3 glass-card p-3 rounded-xl border border-border/60 hover:border-primary/60">
                  {n.cover_url && <img src={n.cover_url} className="h-16 w-24 object-cover rounded-lg" alt="" />}
                  <div className="text-sm font-bold line-clamp-3">{n.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Últimas notícias - rodapé */}
        {latest.length > 0 && (
          <section className="pt-6 border-t border-border/40">
            <h3 className="font-bold mb-3">Últimas notícias</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {latest.slice(0, 6).map((n: any) => (
                <Link key={n.id} to="/noticias/$slug" params={{ slug: n.slug }} className="glass-card rounded-xl overflow-hidden border border-border/60 hover:border-primary/60">
                  {n.cover_url ? (
                    <img src={n.cover_url} className="w-full aspect-video object-cover" alt="" />
                  ) : (
                    <div className="aspect-video bg-gradient-brand grid place-items-center"><Newspaper className="h-8 w-8 text-primary-foreground/50" /></div>
                  )}
                  <div className="p-3"><div className="font-bold text-sm line-clamp-2">{n.title}</div></div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </AppShell>
  );
}
