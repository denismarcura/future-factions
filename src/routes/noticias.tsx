import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Newspaper, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { listNews, listCategories } from "@/lib/news.functions";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias · Desafio dos Palpites" },
      { name: "description", content: "Últimas notícias sobre futebol, Copa do Mundo, entretenimento e mais." },
    ],
  }),
  component: NewsList,
});

function NewsList() {
  const list = useServerFn(listNews);
  const cats = useServerFn(listCategories);
  const [items, setItems] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCat, setActiveCat] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      list({ data: { page, pageSize, categorySlug: activeCat || undefined } }),
      list({ data: { page: 1, pageSize: 10, lastHourOnly: true } }),
      cats(),
    ])
      .then(([a, b, c]) => {
        setItems(a.items);
        setTotal(a.total);
        setLatest(b.items);
        setCategories(c.categories);
      })
      .finally(() => setLoading(false));
  }, [page, activeCat]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow">
            <Newspaper className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">Notícias</h1>
            <p className="text-sm text-muted-foreground">As últimas atualizações em um só lugar.</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveCat(""); setPage(1); }}
            className={`h-9 px-4 rounded-full text-xs font-bold ${!activeCat ? "bg-gradient-brand text-primary-foreground" : "glass-card border border-border/60"}`}
          >Todas</button>
          {categories.map((c) => (
            <button key={c.id}
              onClick={() => { setActiveCat(c.slug); setPage(1); }}
              className={`h-9 px-4 rounded-full text-xs font-bold ${activeCat === c.slug ? "bg-gradient-brand text-primary-foreground" : "glass-card border border-border/60"}`}
            >{c.name}</button>
          ))}
        </div>

        {/* Últimas notícias (1h) */}
        {latest.length > 0 && (
          <section className="glass-card rounded-2xl p-4 border border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <h2 className="font-bold text-sm">Última hora</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {latest.slice(0, 6).map((n) => (
                <Link key={n.id} to="/noticias/$slug" params={{ slug: n.slug }} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                  {n.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grid */}
        {loading ? (
          <div className="min-h-[200px] grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Nenhuma notícia ainda.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((n) => <NewsCard key={n.id} n={n} />)}
          </div>
        )}

        {/* Paginação */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-9 w-9 grid place-items-center rounded-lg glass-card border border-border/60 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-bold">{page} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="h-9 w-9 grid place-items-center rounded-lg glass-card border border-border/60 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}

        {/* Últimas notícias - lista final */}
        {latest.length > 0 && (
          <section className="pt-6 border-t border-border/40">
            <h2 className="font-bold text-lg mb-3">Últimas notícias</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {latest.slice(0, 10).map((n) => (
                <Link key={n.id} to="/noticias/$slug" params={{ slug: n.slug }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                  {n.cover_url && <img src={n.cover_url} className="h-12 w-16 object-cover rounded" alt="" />}
                  <div className="text-sm font-bold line-clamp-2">{n.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function NewsCard({ n }: { n: any }) {
  return (
    <Link to="/noticias/$slug" params={{ slug: n.slug }} className="glass-card rounded-2xl overflow-hidden border border-border/60 hover:border-primary/60 transition group">
      {n.cover_url ? (
        <img src={n.cover_url} alt={n.title} className="w-full aspect-video object-cover group-hover:scale-105 transition" />
      ) : (
        <div className="w-full aspect-video bg-gradient-brand grid place-items-center"><Newspaper className="h-10 w-10 text-primary-foreground/50" /></div>
      )}
      <div className="p-4">
        {n.news_categories?.name && <div className="text-[10px] font-bold uppercase text-primary mb-1">{n.news_categories.name}</div>}
        <h3 className="font-bold text-sm leading-tight line-clamp-2">{n.title}</h3>
        {n.summary && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{n.summary}</p>}
        {n.published_at && <div className="text-[10px] text-muted-foreground mt-2">{new Date(n.published_at).toLocaleString("pt-BR")}</div>}
      </div>
    </Link>
  );
}
