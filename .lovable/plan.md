## Reestruturação do Administrativo — Plano em Fases

Mantém tudo que já existe funcionando. Reorganiza o menu lateral em grupos, expande o Dashboard com KPIs/gráficos reais e adiciona novas seções em etapas.

---

### Fase 1 — Reorganização do menu + Dashboard real (esta entrega)

**Sidebar agrupado** em `src/routes/admin.tsx`, recolhível (já é) e responsivo:

```text
PAINEL
  └── Dashboard

OPERAÇÃO
  ├── Cadastros (usuários)
  ├── Empresas
  └── Convites                       ← novo (placeholder)

CONTEÚDO
  ├── Desafios
  ├── Categorias
  ├── Banners
  └── Resultado dos Jogos

GAMIFICAÇÃO
  ├── Missões
  ├── Bônus de Login                 ← NOVO funcional nesta fase
  ├── Raspadinha                     ← novo (placeholder)
  ├── Loja de Prêmios                ← novo (placeholder)
  └── Ranking                        ← novo (placeholder)

COMUNICAÇÃO
  ├── E-mail Marketing
  └── Notificações                   ← novo (placeholder)

SISTEMA
  ├── Regras IA
  ├── APIs
  ├── Configurações de Tokens        ← novo (placeholder)
  ├── Relatórios                     ← novo (placeholder)
  └── Segurança / Logs               ← novo (placeholder)
```

Placeholders são páginas reais com cabeçalho, descrição do que virá e botão "Em breve" — não quebram navegação. Cada uma vira funcional nas fases seguintes.

**Dashboard (`/admin`) — KPIs e gráficos reais consultando o banco:**

KPIs (cards):
- Usuários cadastrados (total)
- Empresas cadastradas (total)
- Desafios ativos / encerrados
- Participações totais (palpites)
- Tokens distribuídos (soma de `token_transactions`)
- Usuários ativos hoje / semana / mês (DAU/WAU/MAU baseado em `palpites.created_at`)
- Novos cadastros (7d / 30d)

Listas Top:
- Top 5 desafios (por nº de palpites)
- Top 5 empresas (por nº de desafios)

Gráficos (recharts, já instalado):
- Crescimento de usuários (linha, 30 dias)
- Participações por dia (área, 30 dias)
- Tokens distribuídos por dia (barra, 30 dias)
- Cadastros por dia (linha, 30 dias)

Tudo via um único server function `getAdminDashboard` (`src/lib/admin-stats.functions.ts` já existe — vou estender) com `requireSupabaseAuth` + checagem de role admin.

---

### Fase 2 — Bônus de Login (30 dias) — funcional

**Banco** (migração):
- `daily_login_rewards` (config por dia 1–30: tokens, é marco/sim-não)
- `user_login_streak` (user_id, current_streak, longest_streak, last_claim_date, total_claimed)
- `daily_login_claims` (histórico: user_id, day_number, tokens, claimed_at)

**Admin** (`/admin/bonus-login`):
- Tabela editável dia 1 → 30 com tokens de cada dia
- Regras: reinício após X dias sem claim (configurável)
- KPIs: usuários ativos hoje, sequência média, top streaks
- Histórico paginado

**Cliente** (a discutir em outra rodada — esta fase entrega só o admin + a base de dados + server fn `claimDailyBonus` pronta).

---

### Fases seguintes (resumo, não entregues agora)

- **Fase 3 — Ranking Semanal/Mensal** (critérios, premiação, medalhas, histórico)
- **Fase 4 — Raspadinha** (probabilidades, prêmios, limite diário)
- **Fase 5 — Loja de Prêmios** (produtos, estoque, resgates, aprovação)
- **Fase 6 — Convites & Notificações** (visualização + envio segmentado/agendado)
- **Fase 7 — Configurações de Tokens** (parametrização: cadastro, convite, acerto, missão, raspadinha, login)
- **Fase 8 — Relatórios** (exportação Excel/CSV/PDF)
- **Fase 9 — Segurança / Logs** (audit trail: login, alterações, tokens, aprovações, exclusões, IP)
- **Fase 10 — Permissões** (papéis admin/moderador/suporte — hoje só existe `admin`)

Cada uma será planejada e aprovada individualmente.

---

### Detalhes técnicos da Fase 1

**Arquivos alterados/criados:**
- `src/routes/admin.tsx` — sidebar agrupado por categoria com headers (`OPERAÇÃO`, `CONTEÚDO`, etc.), mantendo `collapsible` e responsividade mobile já existentes.
- `src/routes/admin.index.tsx` — substituir conteúdo atual por dashboard com KPIs + gráficos (recharts).
- `src/lib/admin-stats.functions.ts` — estender com `getAdminDashboard()` que retorna `{ kpis, topChallenges, topCompanies, series: { users, predictions, tokens, signups } }`.
- Novas rotas placeholder (página simples com título + "Em breve"):
  - `src/routes/admin.convites.tsx`
  - `src/routes/admin.bonus-login.tsx` *(funcional na Fase 2; placeholder agora)*
  - `src/routes/admin.raspadinha.tsx`
  - `src/routes/admin.loja.tsx`
  - `src/routes/admin.ranking.tsx`
  - `src/routes/admin.notificacoes.tsx`
  - `src/routes/admin.tokens-config.tsx`
  - `src/routes/admin.relatorios.tsx`
  - `src/routes/admin.seguranca.tsx`

**Sem mudanças** em: conteúdo das telas Cadastros, Desafios, Empresas, Categorias, Banners, Missões, Regras IA, APIs, E-mail Marketing, Resultado Jogos, Apuração Copa.

**Segurança:** todas as queries do dashboard rodam em server function com `requireSupabaseAuth` + `has_role(userId, 'admin')`. Sem mudanças em RLS.

**Visual:** mantém identidade atual do admin (verde/prata/dourado, logo do Desafio dos Palpites já presentes no `AppShell`).

---

### O que NÃO está nesta fase

- Bloquear/banir/resetar senha/ajustar tokens na tela de Cadastros (você escolheu manter as telas existentes como estão)
- Aprovar/rejeitar empresas (idem)
- Qualquer feature das Fases 2–10

Aprova essa Fase 1 para eu implementar?
