import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso e Participação — Desafio dos Palpites" },
      {
        name: "description",
        content:
          "Termos de Uso e Participação da plataforma Desafio dos Palpites: regras, condutas, tokens, prêmios e privacidade.",
      },
    ],
  }),
  component: TermosPage,
});

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display font-black text-lg text-foreground">
        <span className="text-gradient-brand">{n}.</span> {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function TermosPage() {
  return (
    <div className="min-h-screen bg-background bg-radial-brand px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img
            src={logoAsset.url}
            alt=""
            className="h-12 w-12 drop-shadow-[0_0_8px_rgba(0,230,118,0.55)]"
          />
          <div className="font-display font-black text-lg">
            DESAFIO <span className="text-gradient-brand">DOS</span>{" "}
            <span className="text-gradient-silver">PALPITES</span>
          </div>
        </Link>

        <div className="glass-card rounded-2xl p-8 border border-border/60 space-y-8">
          <header className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-4 w-4" /> Documento oficial
            </div>
            <h1 className="font-display font-black text-2xl md:text-3xl">
              Termos de Uso e Participação
            </h1>
            <p className="text-sm text-muted-foreground">
              Ao realizar seu cadastro na plataforma Desafio dos Palpites, você declara ter lido,
              compreendido e aceitado integralmente os termos abaixo.
            </p>
          </header>

          <Section n="1" title="Sobre a plataforma">
            <p>
              O Desafio dos Palpites é uma plataforma gratuita de entretenimento, gamificação e
              interação social.
            </p>
            <Bullets
              items={[
                "A plataforma não possui fins lucrativos relacionados aos palpites realizados pelos usuários.",
                "Não existe qualquer modalidade de aposta em dinheiro, jogos de azar ou atividades financeiras envolvendo os participantes.",
                "Os Tokens não possuem valor monetário, não podem ser convertidos em dinheiro, vendidos, negociados ou transferidos entre usuários.",
              ]}
            />
          </Section>

          <Section n="2" title="Responsabilidade sobre prêmios">
            <p>Os desafios poderão ser criados por usuários, empresas, parceiros e patrocinadores.</p>
            <Bullets
              items={[
                "A responsabilidade pela entrega dos prêmios é exclusivamente do organizador do desafio.",
                "O Desafio dos Palpites não garante, patrocina ou se responsabiliza pela entrega de prêmios cadastrados por terceiros.",
                "A plataforma atuará apenas como intermediadora da interação entre participantes e organizadores.",
              ]}
            />
          </Section>

          <Section n="3" title="Conduta dos usuários">
            <p>É proibido:</p>
            <Bullets
              items={[
                "Bullying, assédio, ofensas, discurso de ódio, ameaças, discriminação",
                "Conteúdo ofensivo, fake news, fraudes",
                "Criação de perfis falsos",
              ]}
            />
            <p>
              Qualquer tentativa identificada resultará em <strong>suspensão imediata</strong>,
              <strong> bloqueio da conta</strong> ou <strong>banimento permanente</strong>, sem
              aviso prévio.
            </p>
          </Section>

          <Section n="4" title="Fraudes em missões">
            <p>
              Caso o usuário participe de missões promocionais (seguir perfis, curtir publicações,
              compartilhar conteúdos, inscrever-se em canais, avaliar empresas) e posteriormente
              desfaça a ação apenas para obter vantagens indevidas, poderá sofrer:
            </p>
            <Bullets
              items={[
                "Perda dos tokens recebidos",
                "Desclassificação de desafios",
                "Suspensão temporária",
                "Banimento permanente",
              ]}
            />
          </Section>

          <Section n="5" title="Controle de cadastros">
            <p>Para evitar fraudes, a plataforma poderá limitar a criação de contas.</p>
            <Bullets
              items={[
                "Limite padrão: máximo de 5 contas cadastradas por endereço IP.",
                "Cadastros suspeitos poderão ser analisados manualmente pela administração.",
              ]}
            />
          </Section>

          <Section n="6" title="Login Google">
            <p>
              Usuários que realizarem cadastro utilizando contas Google poderão utilizar normalmente
              a plataforma. Entretanto, caso sejam identificadas irregularidades, múltiplas contas
              ou tentativas de fraude, poderão ser desclassificados de premiações e desafios.
            </p>
          </Section>

          <Section n="7" title="Entrega de prêmios">
            <p>
              Os prêmios disponibilizados pela plataforma poderão levar entre{" "}
              <strong>13 e 30 dias corridos</strong> para processamento e entrega.
            </p>
            <p>O prazo poderá variar conforme estoque, fornecedor, localização e tipo de prêmio.</p>
          </Section>

          <Section n="8" title="Tokens">
            <p>Os Tokens são pontos virtuais utilizados exclusivamente dentro da plataforma.</p>
            <Bullets
              items={[
                "Não possuem valor financeiro",
                "Não podem ser vendidos",
                "Não podem ser trocados por dinheiro",
                "Não geram rendimentos",
                "Não representam ativos financeiros",
              ]}
            />
            <p>
              A administração poderá alterar regras de distribuição e utilização dos Tokens a
              qualquer momento.
            </p>
          </Section>

          <Section n="9" title="CPF e validação">
            <p>A plataforma poderá solicitar CPF para:</p>
            <Bullets
              items={[
                "Validação de identidade",
                "Entrega de premiações",
                "Controle antifraude",
              ]}
            />
            <p>
              O CPF será validado automaticamente. Cadastros com CPFs inválidos poderão ser
              bloqueados ou removidos.
            </p>
          </Section>

          <Section n="10" title="Registro de acesso">
            <p>Ao aceitar estes termos, o usuário autoriza o registro das seguintes informações:</p>
            <Bullets
              items={[
                "Endereço IP",
                "Data e horário",
                "Navegador utilizado",
                "Dispositivo utilizado",
                "Cidade aproximada de acesso",
              ]}
            />
            <p>
              Essas informações serão utilizadas exclusivamente para segurança e prevenção de
              fraudes.
            </p>
          </Section>

          <Section n="11" title="Desclassificação">
            <p>Poderão ser desclassificados:</p>
            <Bullets
              items={[
                "Perfis duplicados",
                "Contas falsas",
                "Uso de robôs",
                "Manipulação de resultados",
                "Fraudes em missões",
                "Compartilhamento indevido de contas",
                "Tentativas de obtenção irregular de Tokens",
              ]}
            />
          </Section>

          <Section n="12" title="Alterações">
            <p>
              O Desafio dos Palpites poderá alterar estes termos a qualquer momento. A utilização
              contínua da plataforma representa concordância com as versões atualizadas.
            </p>
          </Section>

          <Section n="13" title="Aceite">
            <p>Ao marcar a opção no cadastro, declaro que:</p>
            <Bullets
              items={[
                "Li e concordo com os Termos de Uso do Desafio dos Palpites.",
                "Autorizo o registro do meu IP, data e horário de aceite.",
                "Concordo com as regras de participação, pontuação e premiações da plataforma.",
              ]}
            />
          </Section>

          <div className="pt-4 text-center text-xs text-muted-foreground">
            Desafio dos Palpites — www.desafiodospalpites.com.br
          </div>

          <div className="flex justify-center">
            <Link
              to="/auth"
              className="h-11 px-6 inline-flex items-center justify-center rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow"
            >
              Voltar para o cadastro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
