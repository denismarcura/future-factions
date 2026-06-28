Vou atacar todos os problemas reportados em uma rodada, focando nos sintomas concretos que confirmei na base de dados e no código.

## 1. Desafios criados não aparecem na lista

**Causa:** em `src/lib/corp-challenges.functions.ts` (`listLatestCorpChallenges`) há um filtro `Boolean(companyName) || missions.length > 0`. Todos os desafios novos do usuário têm `company_name = null` e `missions = []`, então são descartados. Por isso `tt4196w`, `l169lew`, `48flvua` etc. somem da Home e de /desafios.

**Correção:** remover esse filtro (ou afrouxá-lo para apenas `status = 'ativo'`). Mostrar todo desafio ativo cadastrado pelo wizard.

## 2. Página /previsao/{id} feia + descrição enorme

A página atual concatena todas as perguntas/opções como um parágrafo único (`1. Quem sairá... • 2. Qual será o placar... • ...`) e exibe via `<p>{p.description}</p>` quando o desafio tem partida detectada.

**Correções em `src/routes/previsao.$id.tsx`:**
- Em `corpToPrediction`, só usar `c.description` quando vier preenchida pelo criador. Se vier vazia, deixar `description` curta (ex.: "Faça seus palpites e concorra"), sem dump das perguntas.
- Renderizar as perguntas apenas no formulário de palpites (que já existe), nunca como parágrafo solto acima do card.
- Adicionar no topo o **banner gerado** ao criar a campanha (`c.bannerUrl`) em um bloco com proporção 8:3, bordas arredondadas, fallback para `c.logoUrl`. Atualmente `imageUrl` é passado mas não há um hero visual no topo — vou inserir um `<img>` destacado antes do header do confronto.
- Manter alinhamento dos times e botão PARTICIPAR já implementados.

## 3. Botão "Participar" não envia palpites

Vou instrumentar a confirmação para:
- Validar se há ao menos uma sub-pergunta respondida e dar `toast.error` claro.
- Garantir que `saveParticipation` é chamado mesmo quando não há missões (fluxo corp puro).
- Logar via `debugParticipate` cada etapa (já existe) e expor o erro real no toast (hoje algumas falhas ficam silenciosas).

## 4. Banner gerado precisa aparecer ao abrir o desafio

Já está salvo em `corporate_challenges.banner_url`. Falta exibir no `/previsao/$id`. Vai junto com a correção do item 2.

## 5. E-mail de convite falhando

`email_send_log` está vazio — nada chegou na fila. O `sendFriendInviteEmails` usa `supabaseAdmin.rpc('enqueue_email', ...)` e a infraestrutura Lovable Emails (pgmq + cron). O usuário diz que configurou SMTP no Resend, mas o app não usa Resend — ele enfileira via `enqueue_email`.

**Ações:**
- Verificar via `email_domain--check_email_domain_status` se o domínio Lovable Emails está ativo. Se não estiver, mostrar o diálogo de setup (`<presentation-open-email-setup>`) para o usuário configurar o domínio de envio. Sem isso, nenhum e-mail sai.
- Adicionar tratamento de erro visível em `src/routes/convidar-amigos.tsx`: mostrar a mensagem real retornada pelo servidor (failed[], reason) em vez de um toast genérico.
- Adicionar try/catch com log no handler para inserir uma linha em `email_send_log` com `status='failed'` quando `enqueue_email` retornar erro, para facilitar diagnóstico futuro.

## Arquivos afetados

- `src/lib/corp-challenges.functions.ts` — remover filtro restritivo.
- `src/routes/previsao.$id.tsx` — descrição curta, hero com banner, validação/feedback do botão Participar.
- `src/routes/convidar-amigos.tsx` — mensagens de erro detalhadas.
- `src/lib/friend-invite-emails.functions.ts` — log e retorno de erro mais informativo.
- Setup do domínio de e-mail (intermediário) se ainda não estiver ativo.

## Fora de escopo (confirmar antes)

- Próximos jogos automáticos 28/06 e 29/06: depende do sync football-data.org já existente; posso forçar uma sincronização em sequência se você quiser, mas não está no escopo deste plano.
