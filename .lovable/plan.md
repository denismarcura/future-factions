
# Integração Football-Data.org

Integração completa com a API football-data.org (plano Free) para sincronizar jogos de campeonatos oficiais, criar desafios padronizados automaticamente e atualizar resultados — sem mexer nos desafios da Copa que você já cadastrou manualmente.

## Visão geral

- API Key fica **exclusivamente no backend** (variável de ambiente `FOOTBALL_DATA_API_KEY`). O frontend nunca chama football-data.org direto.
- Toda chamada passa por server functions / server routes do próprio site, com rate-limit interno respeitando os 10 req/min do plano Free.
- Os desafios criados automaticamente recebem uma flag (`source = 'football_data'`) para nunca colidirem com os desafios da Copa cadastrados manualmente.

## Etapas

### 1. Segurança da chave
- Pedir a **nova** chave da football-data.org (depois que você revogar a exposta) e salvar como segredo `FOOTBALL_DATA_API_KEY`.
- Nenhuma referência a `X-Auth-Token` em código de frontend.

### 2. Banco de dados (migração nova)
Criar quatro tabelas no schema `public`, todas com RLS (somente admin lê/escreve via service role nas rotinas):

- `football_competitions` — competições ativadas no admin (code, name, season, active, sync_frequency, auto_create_challenges, auto_update_results, last_synced_at).
- `football_matches` — jogos sincronizados (external_match_id único, competition_code, season, matchday, stage, group, utc_date, data_hora_brasil, home/away_team_id/name/crest, status, score_home, score_away, winner, last_updated_api, linked_challenge_id).
- `football_sync_logs` — log de cada execução (data_hora, competition_code, endpoint, http_status, imported, updated, error_message, duration_ms).
- Em `challenges`: adicionar colunas `source TEXT` ('manual' | 'football_data' | 'world_cup_manual') e `external_match_id TEXT` para vínculo. Desafios existentes ficam como 'manual'/'world_cup_manual'.

### 3. Cliente da API (server-only)
`src/lib/football-data.server.ts`:
- Wrapper `fdFetch(path)` com header `X-Auth-Token`, retry exponencial e rate-limiter em memória (token bucket 10/min). Caso bata limite, espera e tenta de novo.
- Funções: `listMatches(code, { season, dateFrom, dateTo, status, matchday, stage })`, `getMatch(id)`, `listCompetitions()`.

### 4. Server functions admin
`src/lib/football-integrations.functions.ts` (protegidas por `requireSupabaseAuth` + `has_role admin`):
- `listCompetitions`, `upsertCompetition`, `toggleCompetition`.
- `syncCompetition({ code, season, dateFrom?, dateTo? })` — busca jogos, faz upsert por `external_match_id`, grava log.
- `refreshMatch(externalId)` — atualiza um jogo específico.
- `createChallengeForMatch(externalId)` — gera desafio padrão.
- `listSyncedMatches({ filters, pagination })` para a tabela admin.

### 5. Página admin "Integrações de Futebol"
`src/routes/admin.integracoes-futebol.tsx` com 3 abas:

**Competições**: cadastrar/editar as 12 competições Free (WC, CL, BL1, DED, BSA, PD, FL1, ELC, PPL, EC, SA, PL) com toggles ativo, frequência (diária/30min/5min), auto-criar desafios, auto-atualizar resultados, botão "Sincronizar agora".

**Jogos sincronizados**: tabela com Competição, Data/Hora Brasil, Casa, Fora, Status, Placar, Desafio vinculado, e botões "Atualizar agora", "Criar desafio", "Ver palpites". Filtros por competição/status/data.

**Logs**: últimas execuções com status, contagens e erros.

Adicionar link "Integrações de Futebol" no menu admin (sidebar/`admin.tsx`).

### 6. Criação automática de desafios
Quando `auto_create_challenges = true` e o jogo é novo:
- Título: `Palpite: {Casa} x {Fora} — {Competição}`
- Pergunta única: `Qual será o resultado do jogo?` com opções `Vitória {Casa}`, `Empate`, `Vitória {Fora}`.
- Tipo: resultado do jogo. Sem exigência de tokens.
- Deadline: `utc_date - 30 min`.
- `source='football_data'`, `external_match_id` preenchido.
- Vincula `linked_challenge_id` no `football_matches`.

### 7. Apuração automática de resultados
Quando o webhook detecta `status = FINISHED`:
- Atualiza placar/vencedor.
- Marca desafio vinculado como encerrado.
- Dispara a apuração existente (reaproveita lógica de `apurar-copa` / `challenge-ranking`) para calcular ganhadores conforme regras do desafio.
- Não altera desafios `source != 'football_data'` (preserva Copa manual).

### 8. Cron jobs
Endpoint público `src/routes/api/public/hooks/football-sync.ts` (protegido por `apikey` do Supabase, valida origem). Recebe `{ mode: 'daily'|'today'|'live'|'recheck' }`:
- **Diário 03:00 BRT** — busca próximos 14 dias de cada competição ativa.
- **A cada 30 min** — jogos do dia (SCHEDULED/TIMED).
- **A cada 5 min** — jogos IN_PLAY/PAUSED/LIVE.
- **A cada 2 h** — re-checa FINISHED do dia para garantir placar correto.

Agendar via `pg_cron` + `pg_net` (4 jobs). O handler enfileira competições respeitando o rate-limit.

### 9. Logs e observabilidade
Toda chamada à API grava linha em `football_sync_logs`. Erros 429/5xx ficam visíveis na aba Logs e disparam aviso no admin.

## Detalhes técnicos

```text
Cliente (admin UI)
   └─► server function (admin auth)
          └─► football-data.server.ts (rate-limit + retry)
                 └─► api.football-data.org

pg_cron ──► /api/public/hooks/football-sync (apikey) ──► mesma camada server
```

- Mapeamento de status football-data → interno: SCHEDULED/TIMED → "agendado"; IN_PLAY/PAUSED/LIVE → "ao_vivo"; FINISHED → "encerrado"; POSTPONED/SUSPENDED/CANCELLED → "cancelado".
- `data_hora_brasil` calculado a partir de `utcDate` com `Intl.DateTimeFormat('America/Sao_Paulo')`.
- Rate-limiter: token bucket compartilhado por processo + fallback de espera quando a API responde 429 com `X-RequestCounter-Reset`.
- Tabelas com `GRANT` apenas para `service_role` e `authenticated` (admin via RLS `has_role`).
- Tipos TS gerados após a migração.

## Fora do escopo

- Não toca em `world_cup_results` nem em desafios já cadastrados manualmente.
- Não troca o sistema de tokens; desafios automáticos ficam sem entrada de tokens, conforme você pediu.
- Não exibe estatísticas avançadas (gols por jogador etc.) — só placar/status/vencedor que o plano Free entrega de forma confiável.

## O que preciso de você ao aprovar

1. Revogar a chave exposta e gerar uma nova no painel football-data.org.
2. Colar a nova chave no formulário seguro que vou abrir (segredo `FOOTBALL_DATA_API_KEY`).
3. Confirmar quais das 12 competições devem já vir pré-ativadas (posso deixar todas inativas e você liga conforme quiser).
