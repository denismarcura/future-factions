# Automação de Resultados — Desafio dos Palpites

Sistema end-to-end para encerrar desafios, apurar resultados, pontuar usuários, gerar ranking e notificar por e-mail, com painel admin e auditoria.

## 1. Banco de dados (migração)

Ajustes nas tabelas existentes e novas tabelas:

- `challenges`: novas colunas `status` (`aberto | encerrado | em_apuracao | resultado_publicado`), `result_official` (jsonb), `result_source` (`manual | api | ia`), `result_confirmed_at`, `scoring_rules` (jsonb com pontos por tipo de acerto), `apurado_em`.
- `challenge_rankings` (nova): `challenge_id`, `user_id`, `position`, `points`, `tokens_awarded`, `acertos` (jsonb), `tiebreak_data` (jsonb), `created_at`.
- `challenge_result_audit` (nova): `challenge_id`, `changed_by`, `previous_result`, `new_result`, `source`, `changed_at` — histórico imutável de mudanças de resultado.
- `email_notifications` (nova): `user_id`, `challenge_id`, `template`, `status` (`queued|sent|failed`), `error`, `sent_at`.
- `token_transactions`: já existe; reusada com `reason='challenge_reward'` e `reference_id=challenge_id` + constraint única `(user_id, reference_id, reason)` para impedir crédito duplicado.

Todas com RLS: leitura pública apenas em `challenge_rankings`; demais restritas a admin/dono.

## 2. Motor de apuração (server functions)

Arquivo `src/lib/apuracao.functions.ts` com:

- `encerrarDesafiosVencidos()` — cron job: marca `status='encerrado'` e depois `em_apuracao` quando `closes_at < now()`.
- `apurarDesafio(challengeId)` — núcleo: lê resultado oficial, compara com palpites, calcula pontos pelas `scoring_rules`, aplica desempate (amigos ativos → missões → saldo → data do palpite), grava `challenge_rankings`, credita tokens via `token_transactions` (idempotente pela constraint única), marca `resultado_publicado`, enfileira e-mails.
- `recalcularDesafio(challengeId)` — admin: limpa ranking e tokens daquele desafio (estorno auditado) e re-executa apuração.
- `confirmarResultadoManual(challengeId, result)` — admin: grava em `challenge_result_audit` e chama `apurarDesafio`.

Cron `pg_cron` a cada 5 min chama route `/api/public/hooks/apurar-desafios` (já existe estrutura `apurar-copa.ts`; replicamos o padrão).

## 3. Página pública de ranking

Rota `src/routes/ranking.$challengeId.tsx`:

- Banner, nome, resultado oficial, total de participantes
- Tabela de ranking completa (avatar, nome, posição, pontos, tokens, selo dos top 20)
- Top 3 com destaque (ouro/prata/bronze)
- CTA "Participar de novos desafios", "Trocar tokens", "Convidar amigos"
- SEO com `head()` dinâmico (título, og:image = banner do desafio)

## 4. E-mails automáticos

Usar Lovable Emails (infra já recomendada). Dois templates React Email em `src/lib/email-templates/`:

- `ranking-top20.tsx` — para top 20 com posição, pontuação, tokens, sugestões de produtos da loja e novos desafios, 4 CTAs.
- `ranking-participante.tsx` — demais participantes: resultado, sua posição, tokens ganhos, novos desafios.

Enfileiramento via fila existente (`enqueue_email`); cada envio com `idempotencyKey = ${challengeId}-${userId}-${template}`. Status registrado em `email_notifications`.

Prerequisito: configurar domínio de e-mail Lovable (mostrarei o botão de setup se ainda não houver).

## 5. Painel administrativo

Rota `src/routes/admin.apuracao.tsx`:

- Lista de desafios encerrados com filtro por status
- Por linha: "Conferir resultado", "Publicar ranking", "Recalcular pontuação", "Reenviar e-mails"
- Status de envio (queued/sent/failed) e logs
- Histórico de auditoria do resultado (quem/quando/antes/depois)
- Alerta vermelho: "Precisa confirmação manual" quando API/IA falha

## 6. Segurança & integridade

- Constraint única em `token_transactions(user_id, reference_id, reason)` impede crédito duplicado.
- Toda mudança de resultado passa por `confirmarResultadoManual` → grava em `challenge_result_audit`.
- Server functions usam `requireSupabaseAuth` + `has_role('admin')` para ações sensíveis.
- RLS bloqueia leitura/escrita direta nas tabelas de tokens e rankings pelo cliente.

## 7. Identidade visual

Reusar tokens existentes (verde/dourado/prata, glass-card, gradientes brand). Selos de top 20 com `gold`. Responsivo mobile-first. Logo já no `AppShell`.

---

## Detalhes técnicos

- **Stack**: TanStack Start + `createServerFn` + Supabase. Cron via `pg_cron` + `pg_net` chamando `/api/public/hooks/apurar-desafios`.
- **Idempotência**: chave única em `token_transactions` + chave única em `challenge_rankings(challenge_id, user_id)` + `idempotencyKey` no envio de e-mail.
- **Comparação de palpites**: motor genérico que lê `scoring_rules` JSON (`{ winner: 1000, draw: 1000, exact_score: 5000, first_goal: 5000, mission: 50 }`) — funciona para qualquer tipo de desafio (Copa, empresarial, usuário).
- **Fallback**: se `result_source != 'manual'` e API/IA não retornar, status fica `em_apuracao` e admin recebe alerta no painel.

## Perguntas antes de implementar

1. **E-mail**: você já tem domínio de e-mail configurado na plataforma? Se não, o primeiro passo é configurar (~5 min, exige DNS).
2. **Produtos sugeridos no e-mail**: puxo 4 aleatórios da loja, ou você quer escolher manualmente por desafio?
3. **Cron**: roda a cada 5 min OK, ou prefere outro intervalo?

Posso prosseguir com a implementação?