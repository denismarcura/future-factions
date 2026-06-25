# Plano de execução — Desafio dos Palpites

Escopo grande (12 itens). Vou agrupar em 5 frentes lógicas que serão entregues em sequência, preservando layout e funcionalidades existentes.

---

## Frente A — Créditos de Palpites (itens 01, 02, 03)

**Backend (migration):**
- Adicionar coluna `palpite_credits int default 0` em `profiles`.
- Tabela `palpite_credit_transactions` (id, user_id, delta, reason, mission_id, challenge_id, created_at) com RLS + GRANTs.
- Função SQL `grant_palpite_credit(_user_id, _delta, _reason, _mission_id)` (security definer) usada pelo claim de missão.
- Atualizar `mission_claims` para também conceder +1 crédito (além dos tokens já existentes).

**Frontend pós-palpite (`previsao.$id.tsx`):**
Após envio do palpite, mostrar fluxo em 3 etapas no mesmo lugar do banner de sucesso atual:
1. Lista de missões disponíveis (do hook existente em `missions.ts`) com botão "Concluir" — cada uma dá tokens + 1 crédito.
2. Banner "Convide seus amigos e ganhe mais tokens" usando `InviteLinkCard` existente, com CTA "Convidar Amigos".
3. Botão "Ver mais desafios" → `/desafios`.

**Painel do usuário:**
- Em `perfil.tsx`, `dashboard.tsx` e header (onde já mostra tokens), adicionar pill "Créditos de Palpites: X" ao lado do saldo de tokens.

---

## Frente B — Esconder desafios participados e finalizados das áreas públicas (itens 04, 07, 11)

- Reutilizar `useParticipated` (já existe) em todas as listagens públicas: `index.tsx`, `desafios.tsx`, listagens por tema/empresa.
- Adicionar status `archived` ao enum/campo de challenge (já temos status; garantir suporte a: rascunho, ativo, encerrado, finalizado, arquivado).
- Listagens públicas filtram por `status in ('ativo')` AND `id not in (participated)`.
- Dashboard do usuário (`_authenticated/dashboard.tsx`) mostra TODOS os desafios participados, independente de status, com: palpites enviados, status, resultado, pontuação, relatório acertos/erros.
- Admin (`admin.desafios.tsx`): mostra todos exceto `arquivado` por padrão; filtro para ver arquivados.

---

## Frente C — Bug: criação de desafio pela IA (item 06)

Investigar `challenge-ai.functions.ts` + `criar.tsx` fluxo IA. Verificar:
- Salvamento correto em `challenges` (status, campos obrigatórios).
- Criação das perguntas/opções vinculadas.
- Aparição em listagens e em `previsao.$id`.
- Participação e pontuação funcionando ponta a ponta.

Corrigir bugs encontrados e validar com script de teste.

---

## Frente D — Bug: desafio finalizado some (item 07)

- Ajustar query do admin para NÃO filtrar por status ativo.
- Garantir que dashboard busca desafios participados sem filtro de status.
- Página de resultado final do desafio acessível mesmo após finalização (ranking, pontuação, relatório).

---

## Frente E — Seção Empresas + padrão para todos os temas (itens 08, 09, 10)

**Componente reutilizável `ChallengeSection`:**
- Props: tema/empresa, listagem de challenges.
- Grid 3 colunas, 12 por página.
- Busca por nome (empresa ou desafio).
- Filtro "Tempo expirando" (ordena por `closes_at` asc).
- Ordenação default: `created_at desc`.
- Paginação numérica.
- Aplica filtro de participados automaticamente.

**Aplicação:**
- Home: nova seção "Empresas" abaixo do banner "Novo Empresas".
- Cada tema/categoria na home e em `desafios.tsx` usa o mesmo componente.

---

## Frente F — Pequenos ajustes (item 05)

- Remover seção "Mais em Copa do Mundo 2026" do final de `previsao.$id.tsx`.

---

## Detalhes técnicos

**Arquivos novos:**
- `supabase/migrations/<ts>_palpite_credits.sql`
- `src/lib/palpite-credits.functions.ts` — server fns: getCreditBalance, grantCredit, consumeCredit
- `src/components/PostPalpiteFlow.tsx` — sequência missões → convite → próximos
- `src/components/PalpiteCreditsBadge.tsx`
- `src/components/ChallengeSection.tsx` — listagem reutilizável

**Arquivos editados:**
- `src/lib/missions.ts` (claim concede crédito)
- `src/routes/previsao.$id.tsx` (fluxo pós-palpite, remover seção Copa)
- `src/routes/index.tsx` (seção Empresas, aplicar ChallengeSection)
- `src/routes/desafios.tsx` (aplicar ChallengeSection)
- `src/routes/_authenticated/dashboard.tsx` (incluir todos status, créditos)
- `src/routes/perfil.tsx` (pill créditos)
- `src/components/layout/AppShell.tsx` ou TokenPill (pill créditos)
- `src/routes/admin.desafios.tsx` (status + filtros)
- `src/lib/challenge-ai.functions.ts` (fix bug IA)
- `src/lib/user-challenges.ts` / `use-participated.ts` (helpers)

**Regras preservadas:**
- Tokens de boas-vindas, missões existentes, links de convite, layout mobile/desktop.
- Sem remover funcionalidade — apenas adicionar e corrigir.

**Validação no final:**
- Build verde + smoke test Playwright nos fluxos: criar desafio IA → participar → ver missões/banner → ganhar crédito → usar em outro desafio → finalizar → ver no dashboard.

---

## Ordem de execução

1. Frente A (créditos) — fundação de dados nova
2. Frente B + F (filtros públicos + remoção texto)
3. Frente D (fix finalizado)
4. Frente C (fix IA)
5. Frente E (Empresas + padrão temas)
6. Testes finais
