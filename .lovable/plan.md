## Objetivo

Resolver os problemas do gerador de palpites e adicionar fluxo completo de e-mails pós-publicação + relatório final do desafio.

## 1. Corrigir o Gerador de Palpites IA

**Bugs atuais:**
- "Mais Palpites" retorna sempre os mesmos.
- Pergunta "Quem faz o primeiro gol?" sempre traz Sim/Não.

**Correções (`src/lib/challenge-ai.functions.ts`):**
- Passar `existingQuestions` no prompt + `seed` aleatório + `temperature: 1.1` para variar.
- Enviar contexto: **título + data limite + categoria** ao modelo (`google/gemini-3-flash-preview`).
- Instrução: quando a pergunta envolver jogador/time/horário/estádio/fase, gerar respostas reais (ex.: 3 artilheiros de cada time + "Nenhum gol" = 7 opções). Nunca cair em Sim/Não para perguntas de jogador.
- Schema de saída por pergunta: `{ question, options[] }` com 2–10 opções.

## 2. E-mail ao Publicar o Desafio

Novo server fn `sendChallengePublishedEmail` em `src/lib/challenge-emails.functions.ts`:
- Disparado no submit do `/criar` após inserir o desafio.
- Usa Lovable AI Gateway / Resend connector já existente.
- Conteúdo: título, categoria, prêmios, palpites, link para convidar amigos, data limite, visibilidade.

## 3. Relatório Final + E-mail de Encerramento

Quando o desafio é apurado (resultado conferido), enviar e-mail com:
- Top 10 (nome + pontos)
- Clientes mais ativos
- Horário de pico de palpites
- Avaliação média (★)
- Totais: cadastros, usuários ativos, tokens utilizados
- Banner CTA: "Crie seu próximo Desafio — +10.000 tokens bônus para o campeão"

**Implementação:**
- Server fn `sendChallengeResultsEmail` agrega via SQL e envia.
- Hook em `src/lib/result-email.functions.ts` (já existe) — estender.
- Novo componente de e-mail HTML com o banner destacado.

## 4. Banner CTA na Home / Pós-resultado

Após visualizar o resultado em `/previsao/$id`, mostrar banner "Crie seu próximo Desafio" com bônus de 10.000 tokens ao campeão (apenas para o criador do desafio anterior).

## Arquivos

**Editar:**
- `src/lib/challenge-ai.functions.ts` — variedade + contexto IA
- `src/routes/criar.tsx` — disparar e-mail no submit
- `src/lib/result-email.functions.ts` — adicionar payload completo
- `src/routes/previsao.$id.tsx` — banner CTA pós-resultado

**Criar:**
- `src/lib/challenge-emails.functions.ts` — sendChallengePublishedEmail + sendChallengeResultsEmail
- `src/components/NextChallengeBanner.tsx`

## Detalhes técnicos

- Modelo IA: `google/gemini-3-flash-preview` via gateway existente (`ai-gateway.server.ts`).
- E-mail: Resend connector já configurado no projeto (verificar `RESEND_API_KEY`).
- Métricas agregadas via `supabase` autenticado dentro do server fn.
- Avaliação reaproveita tabela `challenge_ratings` criada anteriormente.
