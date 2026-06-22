# Apuração Inteligente da Copa do Mundo

Módulo que consulta automaticamente o site da FIFA, interpreta o resultado com IA, atualiza o card do desafio, apura os palpites e libera tokens — com fallback manual sempre que a confiança for baixa.

## Observação importante sobre a fonte de dados

A IA, sozinha, **não navega** na página da FIFA. Para garantir resultado real (sem inventar placar), o fluxo correto é:

1. O servidor baixa o HTML/markdown da página da FIFA com **Firecrawl** (conector já disponível na Lovable; se não estiver linkado, peço para conectar — sem custo de chave manual).
2. Esse conteúdo + o jogo procurado é enviado para a **Lovable AI Gateway** (Gemini 3 Flash, já configurada via `LOVABLE_API_KEY`).
3. A IA devolve **somente JSON estruturado** (com `confidence`). Sem chute.

Se você preferir usar a sua chave da OpenAI explicitamente, eu troco o provider — mas o gateway Lovable já cobre isso de graça e sem expor chave no frontend.

## Banco de dados (migração única)

Novas colunas em `public.challenges` (ou tabela equivalente — confirmo o nome lendo o código antes da migração):

```
fifa_match_url, fifa_match_id,
home_team, away_team, match_date, match_time,
match_status, home_score, away_score,
winner_team, is_draw,
result_source, result_checked_at, result_confirmed_at,
result_payload_json (jsonb), apuration_status (enum)
```

Novo tipo `apuration_status`:
`aguardando_jogo | jogo_em_andamento | aguardando_resultado | resultado_encontrado | apurado_automaticamente | requer_revisao_manual | finalizado | erro_na_consulta`

Novas tabelas:
- `public.challenge_results_log` — toda consulta da IA (timestamp, desafio, fonte, confidence, JSON completo, erro). Auditoria.
- `public.challenge_winners` — usuário, desafio, motivo, tokens calculados, status (`pendente`, `liberado`, `aguardando_premio_fisico`).
- `public.token_transactions` — histórico de débito/crédito com referência ao desafio/win.

RLS:
- `challenges` e `challenge_winners`: SELECT público nas colunas seguras; INSERT/UPDATE só service_role.
- `challenge_results_log`: só admin (via `has_role`).
- `token_transactions`: usuário vê os próprios; admin vê todos.

GRANTs corretos em cada tabela (regra do projeto).

## Backend — server functions e rota pública

Todas em TanStack `createServerFn` (não Edge Function):

- `src/lib/fifa-results.functions.ts`
  - `fetchFifaMatchResult({ challengeId })` — middleware `requireSupabaseAuth` + checagem `has_role('admin')`. Chama Firecrawl, manda para Lovable AI com prompt estruturado, valida com Zod, grava log, atualiza `challenges`.
  - `recalculateWinners({ challengeId })` — apura todos os palpites do desafio segundo as regras (vencedor, empate, placar exato, mais/menos de 2, ambos marcam).
  - `releaseTokens({ challengeId })` — cria registros em `challenge_winners` + `token_transactions`, atualiza saldo. Prêmios físicos ficam `aguardando_premio_fisico`.
  - `manualConfirmResult({ challengeId, home_score, away_score, observation })` — admin sobrescreve.

- `src/routes/api/public/hooks/apurar-copa.ts` — endpoint chamado pelo cron a cada 15min. Verifica `apikey` no header, busca desafios elegíveis, chama `fetchFifaMatchResult` para cada um, e quando `confidence >= 0.90 && status == finalizado` chama `recalculateWinners` + `releaseTokens`. Caso contrário marca `requer_revisao_manual`.

Cron via `pg_cron + pg_net` apontando para esse hook (`*/15 * * * *`).

## Painel administrativo — `/admin/apuracao-copa`

Nova rota dentro do admin com tabela:

| Desafio | Jogo | Data/Hora | Status | Resultado | Fonte | Confiança | Participantes | Vencedores | Tokens a liberar |

Ações por linha:
`Consultar agora · Atualizar resultado · Recalcular vencedores · Editar placar · Confirmar manualmente · Liberar tokens · Ver histórico (modal com logs)`

Filtros: status, data, busca por jogo.

## Card do desafio (visual)

Atualizar `PredictionCard` para desafios com `match` da Copa:

- **Antes**: `Brasil x Escócia · 24/06/2026 19h · selo "Aguardando Jogo"`
- **Ao vivo**: `Brasil 1 × 0 Escócia · selo vermelho pulsante "AO VIVO"`
- **Final**: bandeiras + placar grande + selo dourado `Resultado Final` + `✅ Apurado automaticamente` (ou `Revisão Manual`).
- Botões: `Ver Palpites · Ver Vencedores · Compartilhar Resultado · Criar Novo Desafio`
- Rodapé: `www.desafiodospalpites.com.br`

Selos reutilizáveis em `src/components/MatchStatusBadge.tsx` (verde/prata/dourado, com glow neon — já temos as utilities `btn-neon`, `shadow-glow-gold`).

## Apuração — regras implementadas

Cada palpite tem um `kind` (vencedor, empate, placar_exato, mais_2, menos_2, ambos_marcam). A função `recalculateWinners` aplica:

- `vencedor`: `option == winner_team`
- `empate`: `is_draw == true`
- `placar_exato`: casa/visitante batem
- `mais_2 / menos_2`: `home + away` vs 2
- `ambos_marcam`: ambos > 0

Tokens distribuídos conforme `prizeTiers` do desafio (já existe no mock). Mensagem padrão:
`"Você ganhou X tokens por acertar [motivo] em [home] [hxa] [away]"`.

## Segurança / regras-chave

- IA **nunca** inventa placar — se `confidence < 0.90` ou `match_found=false` → `requer_revisao_manual`, zero tokens liberados.
- Prêmio físico **sempre** entra como `aguardando_premio_fisico`; admin valida manualmente.
- Hook público autentica via `apikey` header (padrão pg_cron). Server fns admin verificam `has_role('admin')`.
- Todo upsert de placar passa por log auditável.

## Entregáveis (em ordem)

1. Migração SQL (tabelas + enum + RLS + GRANTs + trigger updated_at).
2. Helper Firecrawl + server fns de IA/apuração/payout.
3. Hook `/api/public/hooks/apurar-copa` + cron SQL (`*/15 * * * *`).
4. Tela admin `/admin/apuracao-copa`.
5. Atualização visual do `PredictionCard` + selos da partida.
6. Smoke test: forçar "consultar agora" num desafio existente e validar o ciclo completo.

## Pré-requisitos antes de começar

- Confirmar conector **Firecrawl** está linkado (eu verifico). Se não estiver, te peço para conectar antes da etapa 2.
- Confirmar se a tabela atual de desafios persistidos é `public.challenges` ou outra (leio o código no início).

## Pergunto antes de começar

1. Posso usar a **Lovable AI Gateway (Gemini 3 Flash)** com `LOVABLE_API_KEY` que já existe, ou você quer mesmo a chave da OpenAI/ChatGPT separada?
2. Tokens dos vencedores: pego do campo `prizeTiers` que já existe no desafio, certo? (1º coloca, 2º, 3º)
3. Os palpites dos usuários hoje ficam só em mock (`mock-data`). Posso criar a tabela `palpites` real nessa mesma migração para a apuração funcionar de verdade, ou você prefere que a apuração leia os mocks por enquanto?