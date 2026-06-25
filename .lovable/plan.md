# Histórico detalhado de débitos de tokens

Hoje o saldo (`src/lib/balance.ts`) é calculado a partir de 4 fontes, mas o usuário não consegue ver o que entrou e o que saiu. Vou criar uma página dedicada que lista cada movimento com data, motivo, link de origem e impacto no saldo.

## O que vai aparecer

Uma timeline unificada com filtro (Todos / Entradas / Saídas), mostrando:

**Créditos (entradas)**
- Bônus de boas-vindas (`profiles.welcome_bonus`) — 1 linha inicial
- Missões concluídas (`mission_claims` via `listMyClaims`) — "Missão: {título} — +{tokens_awarded}"

**Débitos (saídas)**
- Participação em desafio (`listParticipations()` no localStorage) — "Palpite em {title} — −{entryFee}" com link para `/previsao/{id}`
- Resgate de prêmio (`listMyRedemptions`) — "Resgate: {prize_name} — −{cost_tokens}" + badge do status (pendente / aprovado / entregue / rejeitado). Resgates rejeitados aparecem riscados com nota "estornado".

Cabeçalho da página:
- Saldo atual (reaproveita `getTokenBalance`)
- Totais do período: total ganho, total gasto, nº de movimentos

## Arquivos

1. **Novo** `src/lib/token-history.ts` — função `buildTokenHistory()` que junta as 4 fontes acima em um array tipado `{ id, date, type: "credit"|"debit", reason, amount, source, link? , status? }`, ordenado por data desc. Sem novas chamadas de rede além das já usadas em `balance.ts`.
2. **Novo** `src/routes/_authenticated/historico-tokens.tsx` — rota protegida, usa `useQuery` para chamar `buildTokenHistory`, renderiza cabeçalho de saldo, filtros (tabs) e lista. Estados de loading/empty. Usa componentes existentes (`Card`, `Badge`, `Tabs`, `Skeleton`).
3. **Editar** `src/routes/perfil.tsx` — adicionar botão/link "Ver histórico de tokens" no bloco onde já mostramos os tokens.

## Fora do escopo

- Sem mudanças no cálculo de saldo, em `criar.tsx`, no fluxo de cobrança, ou em qualquer função server.
- Sem migração de banco — usamos exclusivamente as fontes que já alimentam `getTokenBalance`.
- Sem endpoint novo de admin/estorno.
