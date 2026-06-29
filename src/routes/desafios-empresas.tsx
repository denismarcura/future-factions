import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { CountdownTimer } from "@/components/CountdownTimer";
import { listLatestCorpChallenges } from "@/lib/corp-challenges.functions";
import { isDeadlineExpired } from "@/lib/date-utils";
import {
  Megaphone, Trophy, Users, Sparkles, ArrowRight, CheckCircle2, Pizza,
  Beef, Shirt, IceCream, Car, Dumbbell, Rocket, TrendingUp, Heart,
  Target, Award, Instagram, Facebook, Youtube, Share2, ThumbsUp,
  MessageCircle, Globe, ClipboardList, UserPlus, Gift, Calendar,
  MapPin, ShieldCheck, BarChart3, Bell, Image as ImageIcon, Flame, Clock,
} from "lucide-react";

type CorpChallengeLite = {
  id: string;
  title: string;
  subtitle?: string;
  prizeName?: string;
  endsAt?: string;
  createdAt?: string;
  logoImg?: string | null;
  bannerImg?: string | null;
  status?: string;
};

function useLatestCorpChallenges(limit = 6): CorpChallengeLite[] {
  const [list, setList] = useState<CorpChallengeLite[]>([]);
  const listFn = useServerFn(listLatestCorpChallenges);
  useEffect(() => {
    let cancelled = false;
    const read = async () => {
      try {
        const rows = await listFn({ data: { limit } });
        if (cancelled) return;
        setList(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: r.companyName ?? undefined,
            prizeName: r.prizeName ?? undefined,
            endsAt: r.endsAt ?? undefined,
            createdAt: r.createdAt,
            logoImg: r.logoUrl,
            bannerImg: r.bannerUrl,
            status: r.status,
          })),
        );
      } catch {
        if (!cancelled) setList([]);
      }
    };
    read();
    const onUpdated = () => { read(); };
    window.addEventListener("ddp:corp-challenges-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("ddp:corp-challenges-updated", onUpdated);
    };
  }, [limit, listFn]);
  return list;
}


export const Route = createFileRoute("/desafios-empresas")({
  head: () => ({
    meta: [
      { title: "Desafio dos Palpites para Empresas — Transforme sua marca em experiência" },
      { name: "description", content: "Empresas criam desafios personalizados, distribuem prêmios e aumentam o alcance da marca através da participação dos usuários." },
      { property: "og:title", content: "Desafio dos Palpites para Empresas" },
      { property: "og:description", content: "Crie seu desafio, distribua prêmios e conquiste novos clientes todos os dias." },
    ],
  }),
  component: DesafiosEmpresasPage,
});

const EXAMPLES = [
  { icon: Pizza, brand: "Pizzarias", desafio: "Qual será o placar do jogo Brasil x Argentina?", premio: "2 Rodízios de Pizza", color: "text-red-400" },
  { icon: Beef, brand: "Hamburguerias", desafio: "Quem fará o primeiro gol da partida?", premio: "3 Combos de Hambúrguer", color: "text-orange-400" },
  { icon: Shirt, brand: "Loja de Roupas", desafio: "Quem vencerá a final do campeonato?", premio: "Vale-Compras de R$ 200,00", color: "text-pink-400" },
  { icon: IceCream, brand: "Sorveterias", desafio: "Qual será o resultado exato da partida?", premio: "50 Vales Sorvete", color: "text-cyan-400" },
  { icon: Car, brand: "Concessionárias", desafio: "Qual piloto vencerá a corrida?", premio: "Revisões gratuitas + Test Drives", color: "text-blue-400" },
  { icon: Dumbbell, brand: "Academias", desafio: "Quem será o campeão da competição?", premio: "Planos gratuitos + Avaliação física", color: "text-emerald-400" },
];

const BENEFITS = [
  { icon: Rocket, title: "Maior Alcance", desc: "Sua marca aparece para milhares de participantes." },
  { icon: TrendingUp, title: "Mais Seguidores", desc: "Exija que o participante siga as redes sociais da empresa." },
  { icon: Heart, title: "Mais Engajamento", desc: "Aumente curtidas, compartilhamentos e comentários." },
  { icon: Target, title: "Captação de Leads", desc: "Colete informações dos participantes para futuras campanhas." },
  { icon: Award, title: "Fortalecimento da Marca", desc: "Crie relacionamento e reconhecimento com o público." },
];

const REQUIREMENTS = [
  { icon: Instagram, label: "Seguir Instagram" },
  { icon: Facebook, label: "Seguir Facebook" },
  { icon: Sparkles, label: "Seguir TikTok" },
  { icon: Youtube, label: "Seguir YouTube" },
  { icon: Share2, label: "Compartilhar publicação" },
  { icon: ThumbsUp, label: "Curtir publicação" },
  { icon: MessageCircle, label: "Comentar na publicação" },
  { icon: Globe, label: "Visitar Website" },
  { icon: ClipboardList, label: "Responder pesquisa" },
  { icon: UserPlus, label: "Convidar amigos" },
];

const EXTRA_GUESSES = [
  "Convidar amigos",
  "Compartilhar desafios",
  "Completar missões",
  "Seguir patrocinadores",
  "Participar diariamente",
];

const TIEBREAKERS = [
  { n: "1º", text: "Maior número de convidados ativos na plataforma." },
  { n: "2º", text: "Maior saldo de tokens acumulados." },
  { n: "3º", text: "Maior quantidade de desafios participados." },
  { n: "4º", text: "Participação mais antiga no desafio." },
];

const RESPONSIBILITIES = [
  "Disponibilizar a premiação anunciada.",
  "Informar claramente as regras.",
  "Definir prazo de entrega dos prêmios.",
  "Cumprir integralmente a oferta divulgada.",
  "Autorizar a divulgação de sua marca na plataforma.",
];

const ADVANTAGES = [
  { icon: Globe, label: "Divulgação nacional" },
  { icon: Megaphone, label: "Campanhas patrocinadas" },
  { icon: Bell, label: "Notificações Push" },
  { icon: Flame, label: "Destaque na página inicial" },
  { icon: ImageIcon, label: "Banners promocionais" },
  { icon: BarChart3, label: "Relatórios de desempenho" },
  { icon: TrendingUp, label: "Estatísticas de participação" },
  { icon: Share2, label: "Tráfego para redes sociais" },
  { icon: Users, label: "Captação de novos clientes" },
];

function DesafiosEmpresasPage() {
  const latest = useLatestCorpChallenges(6);
  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/30 glass-card p-6 sm:p-12 mb-10">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold border border-gold/30">
            <Trophy className="h-3 w-3" /> DESAFIO DOS PALPITES · EMPRESAS
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-black leading-[0.95]">
            Transforme sua marca em uma <span className="text-gradient-brand">experiência</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground">
            Empresas criam desafios personalizados, distribuem prêmios, geram visibilidade
            para seus produtos e aumentam o alcance da marca através da participação dos usuários.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/empresas" hash="cadastro" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gradient-brand text-primary-foreground font-black uppercase shadow-glow hover:scale-[1.03] transition">
              Criar meu desafio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/desafios" className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-gold/60 text-gold font-bold hover:bg-gold/10 transition">
              Ver desafios ativos
            </Link>
          </div>
        </div>
      </section>

      {/* ÚLTIMOS DESAFIOS CADASTRADOS */}
      {latest.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <h2 className="font-display text-2xl sm:text-3xl font-black flex items-center gap-2">
              <Flame className="h-7 w-7 text-gold" /> Últimos desafios cadastrados
            </h2>
            <Link to="/desafios" className="text-sm font-semibold text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map((c) => {
              const closed = isDeadlineExpired(c.endsAt);
              return (
                <Link
                  key={c.id}
                  to="/previsao/$id"
                  params={{ id: c.id }}
                  className="group rounded-2xl border border-primary/30 glass-card overflow-hidden hover:border-primary/60 transition flex flex-col"
                >
                  {c.bannerImg ? (
                    <img src={c.bannerImg} alt={c.title} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/20 via-background to-gold/20" />
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-2">
                      {c.logoImg && (
                        <img src={c.logoImg} alt="" className="h-10 w-10 rounded-lg object-cover border border-border/60 -mt-8 bg-background" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-black truncate">{c.title}</h3>
                        {c.subtitle && <div className="text-xs text-muted-foreground truncate">{c.subtitle}</div>}
                      </div>
                    </div>
                    {c.prizeName && (
                      <div className="text-sm text-gold font-bold mb-2">🏆 {c.prizeName}</div>
                    )}
                    {c.endsAt && (
                      <div className={`mt-auto inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${closed ? "border-destructive/40 text-destructive bg-destructive/10" : "border-primary/40 text-primary bg-primary/10"}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {closed ? "Apostas encerradas" : <>Encerra em <CountdownTimer closesAt={c.endsAt} /></>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* COMO FUNCIONA */}
      <section className="mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-4">Como funciona</h2>
        <p className="text-muted-foreground mb-5">A empresa cria um desafio exclusivo na plataforma e define:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            "Título do desafio",
            "Período de participação",
            "Regras de participação",
            "Quantidade de vencedores",
            "Premiação",
            "Região de abrangência (Cidade, Estado ou Brasil)",
            "Critérios de validação",
            "Critérios de desempate",
          ].map((it) => (
            <div key={it} className="rounded-xl border border-border/60 bg-card p-4 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{it}</span>
            </div>
          ))}
        </div>
      </section>

      {/* EXEMPLOS */}
      <section className="mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-5">Exemplos de desafios</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXAMPLES.map((e) => (
            <div key={e.brand} className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/50 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-11 w-11 rounded-xl bg-background/60 border border-border/60 grid place-items-center ${e.color}`}>
                  <e.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-black">{e.brand}</h3>
              </div>
              <p className="text-sm text-foreground mb-3 italic">"{e.desafio}"</p>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Prêmio</div>
              <div className="text-sm font-bold text-gold">🏆 {e.premio}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-5">Benefícios para a empresa</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-primary/20 glass-card p-5">
              <b.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-display font-bold text-lg">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REQUISITOS */}
      <section className="mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-2">Requisitos para participar</h2>
        <p className="text-muted-foreground mb-5">A empresa poderá exigir uma ou mais ações:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REQUIREMENTS.map((r) => (
            <div key={r.label} className="rounded-xl border border-border/60 bg-card p-3 flex items-center gap-2">
              <r.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-xs font-semibold">{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* GANHE MAIS PALPITES */}
      <section className="mb-10 rounded-3xl border border-gold/30 glass-card p-6 sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2">
          <Gift className="h-7 w-7 text-gold" /> Ganhe mais palpites
        </h2>
        <p className="text-muted-foreground mb-5">Os participantes podem ganhar palpites extras ao:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {EXTRA_GUESSES.map((g) => (
            <div key={g} className="rounded-xl bg-background/40 border border-gold/20 p-4 text-center">
              <div className="text-2xl mb-1">🎁</div>
              <div className="text-sm font-bold">{g}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CRITÉRIOS DE DESEMPATE */}
      <section className="mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-2">Critérios de desempate</h2>
        <p className="text-muted-foreground mb-5">Em caso de empate entre participantes:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIEBREAKERS.map((t) => (
            <div key={t.n} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="font-display text-3xl font-black text-gradient-brand">{t.n}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1 mb-2">Critério</div>
              <p className="text-sm">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RESPONSABILIDADE */}
      <section className="mb-10 rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-5 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> Responsabilidade da empresa
        </h2>
        <ul className="space-y-3">
          {RESPONSIBILITIES.map((r) => (
            <li key={r} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* VANTAGENS EXCLUSIVAS */}
      <section className="mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black mb-5">Vantagens exclusivas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ADVANTAGES.map((a) => (
            <div key={a.label} className="rounded-xl border border-primary/20 bg-card p-4 flex items-center gap-3 hover:border-primary/50 transition">
              <a.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* EXEMPLO DE DESAFIO CORPORATIVO */}
      <section className="mb-10 rounded-3xl border border-gold/40 glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold border border-gold/30">
            EXEMPLO REAL
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-black flex items-center gap-2">
            <Pizza className="h-7 w-7 text-red-400" /> Casa da Pizza Americana
          </h2>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Desafio</div>
              <div className="font-bold mt-1">Qual será o placar de Brasil x Alemanha?</div>
            </div>
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Prêmio</div>
              <div className="font-bold mt-1 text-gold">🏆 10 Rodízios de Pizza</div>
            </div>
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Participação</div>
              <div className="font-bold mt-1 text-primary">Gratuita</div>
            </div>
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Período
              </div>
              <div className="font-bold mt-1">20/06/2026 até 25/06/2026</div>
            </div>
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Abrangência
              </div>
              <div className="font-bold mt-1">Todo o Brasil</div>
            </div>
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Vencedores</div>
              <div className="font-bold mt-1">10 participantes</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-background/50 border border-border/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Requisitos</div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Seguir Instagram da empresa</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Curtir a publicação oficial</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Compartilhar nos Stories</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="rounded-3xl border border-primary/40 glass-card p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl sm:text-4xl font-black">DESAFIO DOS PALPITES</h2>
          <div className="mt-5 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="rounded-xl bg-background/40 border border-border/60 p-4">
              <div className="text-2xl mb-1">🚀</div>
              <div className="font-bold">Sua empresa ganha visibilidade</div>
            </div>
            <div className="rounded-xl bg-background/40 border border-border/60 p-4">
              <div className="text-2xl mb-1">🎉</div>
              <div className="font-bold">Seus clientes se divertem</div>
            </div>
            <div className="rounded-xl bg-background/40 border border-border/60 p-4">
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold">Sua marca cresce</div>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
            Crie seu desafio, distribua prêmios e conquiste novos clientes todos os dias. 🚀🏆💚🥇
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link to="/empresas" hash="cadastro" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-gradient-brand text-primary-foreground font-black uppercase shadow-glow hover:scale-[1.03] transition">
              Cadastrar minha empresa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">www.desafiodospalpites.com.br</div>
        </div>
      </section>
    </AppShell>
  );
}
