
Sinto muito pelo transtorno. Identifiquei exatamente o que está causando cada problema e proponho corrigir tudo de uma vez. Sobre os tokens cobrados em duplicidade, abaixo também explico o passo a passo para solicitar o estorno.

## 1. "Siga as missões" sai da tela do desafio

**Causa:** o card "Siga as missões" do bloco *Ganhe mais pontos para dar palpites* é um `<Link to="/missoes">` — ele navega para fora da página do desafio.

**Correção:** transformar em link que abre `/missoes` em nova aba (`target="_blank"`), assim o usuário não perde a tela do desafio em que está. Mesmo comportamento dos demais botões de missão (que já abrem em nova aba).

## 2. WhatsApp gera link errado (manda `/auth?ref=...` em vez do link do desafio)

**Causa:** o componente `EarnMorePointsCTA` é genérico e só conhece o código de indicação do usuário; quando aparece dentro de uma página de desafio, ele continua mandando só o link `/auth?ref=…`.

**Correção:**
- Aceitar uma prop opcional `challenge` (id, título, imagem) no `EarnMorePointsCTA`.
- Em `previsao.$id.tsx`, passar o desafio atual para o componente.
- Quando houver desafio, o link compartilhado vira a rota de convite do amigo já apontando para o desafio:
  `https://www.desafiodospalpites.com.br/amigo/<ref8>?d=<challengeId>`
  (essa rota já existe e mostra o banner + leva o amigo direto para o desafio depois do cadastro, mantendo seu crédito de indicação).
- A mensagem do WhatsApp passa a ser:
  *"🎯 Vem palpitar comigo no desafio "<título>"! 100% grátis, só tokens. Use meu link e ganhe tokens de boas-vindas: <link>"*
- Mesmo tratamento para o "Copiar código de indicação" e para o e-mail, sempre que houver desafio em contexto.

## 3. Missões de seguir perfis sumiram do desafio (todas com "Expirou")

**Causa:** as missões na página inicial/desafio usam um contador de 24h baseado em `localStorage` (`ddp:mission-seen:<id>`) — o relógio começa na primeira vez que você abriu a missão. Passadas 24h o card fica marcado "Expirou" para sempre **naquele navegador**, mesmo que a missão continue ativa no admin. Por isso elas "sumiram" do desafio para você.

**Correção:**
- Remover o gating "Expirou" do bloco de missões dentro da página do desafio: missões de **seguir/se inscrever** (evergreen) ficam sempre visíveis enquanto estiverem ativas no admin, independente do localStorage. O contador de 24h continua existindo, mas só como informação visual no dashboard — sem ocultar/expirar a missão.
- Garantir que a seção "Missões bônus / palpites extras por missões" sempre apareça em **toda página de desafio** (corporativo ou padrão), buscando do catálogo global (`listMissions` para Instagram/YouTube/TikTok com `action_type` = `follow`/`subscribe`) quando o desafio não tem missões próprias cadastradas — esse fallback já existe no código, mas a função estava filtrando missões expiradas; vamos parar de filtrar pelo flag local.
- Resultado: você (e qualquer usuário) sempre verá a fila de missões disponíveis no desafio, podendo ganhar TKN extras sem precisar gastar tokens próprios.

## 4. Tokens cobrados duas vezes — passo a passo para solicitar o reembolso

Como sou a IA da plataforma, eu não consigo aplicar crédito na sua conta diretamente. O fluxo certo é este (e na próxima rodada posso criar uma página de "Pedir estorno de tokens" no seu painel, é só pedir):

1. **Reúna os dados** do débito duplicado:
   - E-mail da sua conta
   - Nome do desafio (ex.: *Marrocos x Haiti — Copa do Mundo 2026*)
   - Data/horário aproximado das duas cobranças
   - Quantidade de TKN debitados (e, se possível, print do extrato em **Dashboard → Tokens / Extrato**)
2. **Abra um chamado de estorno** com o suporte enviando esses dados para o e-mail de contato do site (o que estiver em **Termos** / rodapé). Assunto sugerido: *"Estorno de tokens cobrados em duplicidade — desafio <nome>"*.
3. O administrador valida no extrato (tabela `token_transactions`) e, se confirmado o débito duplicado, credita os TKN de volta na sua conta como ajuste manual.
4. Se quiser, na próxima iteração eu adiciono um botão **"Pedir estorno"** dentro do seu Dashboard que envia esse chamado automaticamente já com extrato anexado — me confirme que faço.

---

### Resumo técnico das alterações de código

| Arquivo | Mudança |
|---|---|
| `src/components/EarnMorePointsCTA.tsx` | Aceitar prop opcional `challenge?: { id; title; image? }`. Quando presente, gerar `inviteUrl = ${origin}/amigo/${ref8}?d=${challenge.id}` e ajustar `waMsg` / `emailBody` / texto do botão de copiar. Trocar `<Link to="/missoes">` por `<a href="/missoes" target="_blank" rel="noreferrer">`. |
| `src/routes/previsao.$id.tsx` | Passar `<EarnMorePointsCTA challenge={{ id: p.id, title: p.title, image: p.image }} />`. Remover qualquer filtro de "expirou" sobre a fila de missões evergreen na seção "Palpites extras por missões". |
| (opcional, sem mudança lógica de regra) `useMissionDeadline` continua só para exibir contador no dashboard; deixa de ser usado para esconder missões na página do desafio. |

Nenhuma migração de banco é necessária. Tudo é frontend.
