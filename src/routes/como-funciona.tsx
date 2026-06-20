import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import {
  BookOpen,
  UserPlus,
  Target,
  Trophy,
  ShoppingBag,
  Sparkles,
  Gift,
  Users,
  CheckCircle2,
  Calendar,
  Share2,
  Medal,
  Award,
  Building2,
  Crown,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona os Tokens — Desafio dos Palpites" },
      {
        name: "description",
        content:
          "Entenda como ganhar, acumular e trocar Tokens: cadastro, indicações, acertos, missões diárias, níveis, conquistas e loja de prêmios.",
      },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: UserPlus, title: "Cadastre-se grátis", desc: "Ganhe 1.000 Tokens só por entrar. Sem cartão, sem pegadinha." },
  { icon: Target, title: "Participe de desafios", desc: "Futebol, UFC, NBA, criptos, reality, política — ou crie um desafio entre amigos." },
  { icon: Trophy, title: "Acerte e suba no ranking", desc: "Acertou? Mais Tokens, vitórias e visibilidade no Top 100." },
  { icon: ShoppingBag, title: "Troque por prêmios", desc: "iPhone, console, voucher iFood, camisa oficial, brindes de empresas parceiras." },
];

type Row = { action: string; reward: string };

function RewardTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Ação</th>
            <th className="text-right px-4 py-3 font-semibold">Recompensa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">{r.action}</td>
              <td className="px-4 py-3 text-right font-bold text-primary whitespace-nowrap">{r.reward}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  icon: Icon,
  badge,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-5">
        <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <span className="inline-block text-[10px] uppercase tracking-widest text-accent font-bold mb-1">{badge}</span>
          <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight">{title}</h2>
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const LEVELS = [
  { name: "Bronze", range: "0 a 10.000 Tokens", color: "from-amber-700 to-amber-500" },
  { name: "Prata", range: "10.001 a 50.000 Tokens", color: "from-slate-400 to-slate-200" },
  { name: "Ouro", range: "50.001 a 200.000 Tokens", color: "from-yellow-500 to-yellow-300" },
  { name: "Diamante", range: "200.001 a 1.000.000 Tokens", color: "from-cyan-400 to-blue-300" },
  { name: "Lenda", range: "Acima de 1.000.000 Tokens", color: "from-fuchsia-500 via-primary to-accent" },
];

const ACHIEVEMENTS = [
  { name: "Primeiro Palpite", reward: "100 Tokens" },
  { name: "10 Palpites Corretos", reward: "1.000 Tokens" },
  { name: "100 Palpites Corretos", reward: "10.000 Tokens" },
  { name: "100 Amigos Convidados", reward: "20.000 Tokens" },
];

const SHOP = [
  { tag: "Brinde", item: "Chaveiro", price: "5.000" },
  { tag: "Brinde", item: "Caneca", price: "15.000" },
  { tag: "Coleção", item: "Camiseta", price: "50.000" },
  { tag: "Tecnologia", item: "Fone Bluetooth", price: "100.000" },
  { tag: "Premium", item: "Smartwatch", price: "200.000" },
  { tag: "Casa inteligente", item: "Alexa", price: "300.000" },
  { tag: "Áudio", item: "Caixa JBL", price: "500.000" },
  { tag: "Gamer", item: "Playstation 5", price: "2.000.000" },
  { tag: "Top prêmio", item: "Notebook", price: "3.000.000" },
  { tag: "Super prêmio", item: "iPhone 17 Pro Max", price: "5.000.000" },
];

const COMPANIES = [
  { brand: "Pizzaria do João", challenge: "Qual será o placar de Corinthians x Palmeiras?", price: "10.000 Tokens", prize: "Pizza Grande" },
  { brand: "Hamburgueria", challenge: "Quem marcará o primeiro gol?", price: "5.000 Tokens", prize: "Combo Especial" },
];

const RANKING = [
  { pos: "1º colocado", reward: "2.500.000 Tokens" },
  { pos: "2º colocado", reward: "2.100.000 Tokens" },
  { pos: "3º colocado", reward: "1.950.000 Tokens" },
];

const BUSINESS = [
  "Empresas patrocinando desafios",
  "Destaque de desafios",
  "Publicidade na plataforma",
  "Marketplace de prêmios",
  "Programa de afiliados",
  "Espaços patrocinados",
  "Desafios exclusivos de marcas",
];

const CHALLENGE_TYPES = [
  {
    icon: Target,
    tag: "Aberto",
    title: "Desafio Aberto",
    desc: "Criado por patrocinadores, pela nossa equipe ou por você. Prêmios variam de uma pizza local até TVs de 50 polegadas — com desafios para sua cidade e para todo o Brasil.",
    accent: "from-primary/30 to-accent/20",
  },
  {
    icon: Users,
    tag: "Privado",
    title: "Desafio Privado",
    desc: "Você mesmo cria — de um palpite sobre o casal de amigos voltar até bolões de futebol. Damos 500 Tokens para todos os participantes. Se passar de 100 participantes, o 1º colocado ganha prêmio e você ganha 10.000 Tokens.",
    accent: "from-accent/30 to-primary/20",
  },
  {
    icon: Building2,
    tag: "Patrocinado",
    title: "Desafio Patrocinado",
    desc: "Empresas cadastram desafios e escolhem quantos brindes distribuir. Pode ser por cidade, estado, viagens, celulares, video games, ingressos de cinema e muito mais.",
    accent: "from-primary/20 to-fuchsia-500/20",
  },
];

function HowItWorks() {
  return (
    <AppShell>
      <header className="mb-10">
        <h1 className="font-display text-3xl sm:text-5xl font-black flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" /> Desafio dos <span className="text-gradient-brand">Palpites</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">
          Você já fez uma aposta com um amigo? Já participou de um bolão? O{" "}
          <strong className="text-foreground">Desafio dos Palpites</strong> é a plataforma para você se divertir com seus
          amigos, <strong className="text-foreground">sem gastar R$ 1 real</strong>, e ainda ganhar Tokens para trocar por
          brindes fantásticos.
        </p>
      </header>

      {/* 3 tipos de desafios */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-display text-2xl sm:text-3xl font-black">
            Os 3 tipos de <span className="text-gradient-brand">Desafios</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {CHALLENGE_TYPES.map((t, i) => (
            <div key={i} className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${t.accent} relative overflow-hidden`}>
              <span className="inline-block text-[10px] uppercase tracking-widest text-accent font-bold mb-2">
                {t.tag}
              </span>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-black text-xl">{t.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-5 max-w-3xl">
          <Sparkles className="inline h-4 w-4 text-accent mr-1" />
          <strong className="text-foreground">Missões</strong>: ao completar missões (seguir, curtir, comentar nas redes
          sociais) você ganha créditos extras para dar mais palpites.
        </p>
      </section>

      {/* Prêmio mérito iPhone 17 */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 mb-12 bg-gradient-to-br from-primary/15 via-accent/10 to-fuchsia-500/15 border border-primary/30">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <span className="inline-block text-[10px] uppercase tracking-widest text-accent font-bold mb-1">
              Ranking por mérito
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight">
              Prêmio: <span className="text-gradient-brand">iPhone 17</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-3xl leading-relaxed">
              Teremos um ranking que avalia os usuários que mais participam, acertam e convidam amigos — com premiação
              alta de Tokens para quem indicar o Desafio dos Palpites para empresas, restaurantes etc. O prêmio é um{" "}
              <strong className="text-foreground">iPhone 17</strong>, e{" "}
              <strong className="text-foreground">não é sorteio — é mérito</strong>. A data será divulgada 1 mês antes.
            </p>
          </div>
        </div>
      </section>

      {/* Exemplo de Desafio Aberto */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 mb-12">
        <div className="flex items-start gap-4 mb-5">
          <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="inline-block text-[10px] uppercase tracking-widest text-accent font-bold mb-1">
              Exemplo prático · custa 100 Tokens criar
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight">
              Como funciona um <span className="text-gradient-brand">Desafio Aberto</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Qualquer usuário cadastra. Exemplo: um jogo da Copa do Mundo — Brasil x Haiti.
            </p>
          </div>
        </div>
        <RewardTable
          rows={[
            { action: "Quem ganha o jogo? (Brasil x Haiti)", reward: "100 Tokens" },
            { action: "Quem faz o primeiro gol? (Brasil x Haiti)", reward: "100 Tokens" },
            { action: "Neymar vai jogar? (Sim / Não)", reward: "50 Tokens" },
            { action: "Qual jogador faz o primeiro gol? (Neymar / Endrick / Vini Jr. / jogador do Haiti)", reward: "500 Tokens" },
          ]}
        />
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 flex items-start gap-3">
          <Gift className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong className="text-foreground">Prêmio extra:</strong> quem acertar todos os palpites ganha uma{" "}
            <strong className="text-foreground">camiseta do Brasil</strong>.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          No Desafio dos Palpites, os Tokens são simples de entender, divertidos de acumular e desejados — o segredo é
          fazer com que as pessoas voltem todos os dias para ganhar mais.
        </p>
      </section>

      {/* 4 passos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {STEPS.map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">PASSO {i + 1}</span>
            </div>
            <h3 className="font-display font-bold text-lg mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl sm:text-4xl font-black mb-6">
        Como ganhar <span className="text-gradient-brand">Tokens</span>
      </h2>

      <div className="space-y-6 mb-12">
        <Section
          icon={Gift}
          badge="1.000 Tokens"
          title="Cadastro"
          subtitle="Novo usuário recebe saldo inicial para já entrar competindo."
        >
          <RewardTable rows={[{ action: "Criar a conta", reward: "1.000 Tokens" }]} />
        </Section>

        <Section
          icon={Users}
          badge="+100 por amigo"
          title="Convide amigos"
          subtitle="Cada amigo cadastrado e ativo gera bônus direto para sua carteira."
        >
          <RewardTable
            rows={[
              { action: "Cada amigo ativo", reward: "100 Tokens" },
              { action: "10 amigos", reward: "1.000 Tokens" },
              { action: "100 amigos", reward: "10.000 Tokens" },
              { action: "1.000 amigos", reward: "100.000 Tokens" },
            ]}
          />
        </Section>

        <Section
          icon={CheckCircle2}
          badge="Acertos"
          title="Palpites corretos"
          subtitle="Quanto mais você acerta, mais deseja voltar no dia seguinte."
        >
          <RewardTable
            rows={[
              { action: "Acertou o placar", reward: "100 Tokens" },
              { action: "Acertou o vencedor da partida", reward: "50 Tokens" },
              { action: "Acertou resultado exato de campeonato", reward: "25.000 Tokens" },
            ]}
          />
        </Section>

        <Section
          icon={Calendar}
          badge="Diário"
          title="Missões diárias"
          subtitle="O sistema foi pensado para fazer a comunidade voltar todos os dias."
        >
          <RewardTable
            rows={[
              { action: "Check-in diário", reward: "10 Tokens" },
              { action: "Fazer 5 palpites no dia", reward: "50 Tokens" },
              { action: "Compartilhar desafio e trazer cadastro", reward: "100 Tokens" },
            ]}
          />
          <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
            A partir do 6º palpite do dia, o usuário continua jogando, mas não acumula novos tokens nessa missão.
          </p>
        </Section>

        <Section
          icon={Share2}
          badge="Social"
          title="Missões nas redes sociais"
          subtitle="Curtidas, follows e visualizações transformam alcance em recompensa."
        >
          <RewardTable
            rows={[
              { action: "Curtir Instagrans indicados", reward: "10 Tokens" },
              { action: "Curtir Facebook indicados", reward: "10 Tokens" },
              { action: "Curtir vídeo Youtube indicado", reward: "20 Tokens" },
              { action: "Seguir Instagram", reward: "20 Tokens" },
              { action: "Seguir Facebook", reward: "20 Tokens" },
              { action: "Seguir Youtube", reward: "20 Tokens" },
              { action: "Seguir TikTok", reward: "20 Tokens" },
            ]}
          />
        </Section>
      </div>

      {/* Níveis */}
      <Section icon={Medal} badge="Progresso" title="Sistema de níveis">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {LEVELS.map((l) => (
            <div key={l.name} className="rounded-xl border border-border/60 p-4 bg-card/40">
              <div className={`h-2 w-full rounded-full bg-gradient-to-r ${l.color} mb-3`} />
              <div className="font-display font-black text-lg">{l.name}</div>
              <div className="text-xs text-muted-foreground">{l.range}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-6" />

      {/* Conquistas */}
      <Section icon={Award} badge="Badges" title="Conquistas">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.name} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Award className="h-5 w-5 text-accent mb-2" />
              <div className="font-bold text-sm">{a.name}</div>
              <div className="text-primary font-black mt-1">{a.reward}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-6" />

      {/* Loja */}
      <Section icon={ShoppingBag} badge="Marketplace" title="Loja de prêmios" subtitle="Cada prêmio possui um botão para solicitar a troca dos tokens por produto. Troca sujeita à conferência de saldo e disponibilidade.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SHOP.map((p) => (
            <div key={p.item} className="rounded-xl border border-border/60 p-4 bg-card/40 flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{p.tag}</span>
              <div className="font-display font-black text-lg mt-1">{p.item}</div>
              <div className="text-primary font-bold mt-1">{p.price} Tokens</div>
              <Link
                to="/shop"
                className="mt-3 text-center text-xs font-bold rounded-lg border border-primary/40 hover:bg-primary hover:text-primary-foreground transition-colors py-2"
              >
                Solicitar troca
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-6" />

      {/* Empresas */}
      <Section icon={Building2} badge="Parceiros" title="Tokens para empresas" subtitle="Marcas locais criam desafios e oferecem prêmios próprios.">
        <div className="grid sm:grid-cols-2 gap-3">
          {COMPANIES.map((c) => (
            <div key={c.brand} className="rounded-xl border border-border/60 p-4 bg-card/40">
              <div className="text-xs text-muted-foreground">{c.brand}</div>
              <div className="font-bold mt-1">{c.challenge}</div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-primary font-black">{c.price}</span>
                <span className="text-sm text-accent font-bold">{c.prize}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-6" />

      {/* Ranking nacional */}
      <Section icon={Crown} badge="Top 100 Brasil" title="Ranking nacional" subtitle="Competição saudável, engajamento constante e desejo diário de continuar acumulando tokens.">
        <div className="grid sm:grid-cols-3 gap-3">
          {RANKING.map((r) => (
            <div key={r.pos} className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-center">
              <Crown className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="font-bold">{r.pos}</div>
              <div className="text-primary font-black mt-1">{r.reward}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-6" />

      {/* Modelo de negócio */}
      <Section icon={Sparkles} badge="Sustentabilidade" title="Modelo de negócio">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {BUSINESS.map((b) => (
            <div key={b} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 bg-card/40">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Importante */}
      <div className="mt-10 rounded-2xl border border-accent/40 bg-accent/5 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-accent" />
          <h3 className="font-display text-xl font-black">Importante</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>Os tokens são uma <strong className="text-foreground">moeda virtual</strong> da plataforma.</li>
          <li>Não possuem valor financeiro e <strong className="text-foreground">não podem ser sacados em dinheiro</strong>.</li>
          <li>Servem exclusivamente para prêmios, brindes, desafios especiais, ranking, medalhas, conquistas e sorteios.</li>
          <li>Os tokens não podem ser vendidos, transferidos ou negociados entre usuários.</li>
          <li>Todo token acumulado possui <strong className="text-foreground">validade de 12 meses</strong> a partir da data em que foi recebido.</li>
          <li>A cada nova movimentação, a plataforma pode exibir o histórico e a data limite de uso de cada saldo.</li>
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="rounded-xl bg-primary text-primary-foreground font-bold px-5 py-3 hover:opacity-90 transition">
          Começar a palpitar
        </Link>
        <Link to="/shop" className="rounded-xl border border-border font-bold px-5 py-3 hover:bg-card transition">
          Ver loja de prêmios
        </Link>
      </div>
    </AppShell>
  );
}
