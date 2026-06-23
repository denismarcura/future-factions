
## Visão geral
Reorganizar `criar.tsx` em uma sequência guiada (01-08) com auto-avanço, popup de seleção de prêmios, autocomplete de cidades IBGE, e adicionar sistema de avaliação 5 estrelas + ranking Top 100 mensal (dia 10).

## Etapas do formulário (criar.tsx)

Reordenar a UI em 8 cards numerados. Cada card é colapsado quando o anterior não foi preenchido; ao validar o passo atual, expande automaticamente o próximo (scroll suave).

```
01 Nome do Desafio        → ao digitar 4+ chars + blur, expande 02
02 Categoria + Fim        → ao escolher, expande 03
03 Palpites (subcategorias + IA) → ao ter 1+, expande 04
04 Ganhador (regras de acerto)   → ao confirmar, expande 05
05 Prêmios físicos        → botão "Selecionar prêmios" abre popup
06 Banner do desafio      → upload 1600x600 (mantém)
07 Missões                → passo a passo, 50 tokens + 1 chance cada
08 Link de divulgação     → preview do share URL + visibilidade
```

## Passo 05 — Popup de prêmios

Novo modal `<PrizesPicker>`:
- Pergunta "Quantos prêmios sortear?" (1 a 10)
- Lista os prêmios cadastrados em `admin_prizes` (carregada via server fn pública read-only)
- Para cada slot (1º, 2º, ..., Nº lugar) usuário escolhe um prêmio
- O upload "Prêmio do desafio (opcional)" existente continua, mas a área de imagem muda para proporção 4:5

O cadastro antigo de prêmio único do desafio continua existindo (alterada apenas a proporção do crop/preview para 4:5).

## Passo 08 — Visibilidade + cidades

Abaixo do preview do link:
- Radio: **Aberto** | **Fechado (apenas amigos)**
- Se Aberto: radio extra
  - "Brasil todo" 
  - "Apenas cidades selecionadas" → autocomplete IBGE (`https://servicodados.ibge.gov.br/api/v1/localidades/municipios`), busca após 3 chars, chips de cidades selecionadas
  - Checkbox: "Autorizo divulgação por e-mail marketing, Instagram e redes sociais"
- Se Fechado: popup informativo "Você é responsável pela divulgação do link"
- Em ambos: checkbox obrigatório "O Desafio dos Palpites não se responsabiliza pela entrega dos brindes aqui cadastrados"

## Card na home

Toda criação gera um card exibido em uma nova seção na home: **"Criados pela comunidade"** (filtrando só os públicos). Já existe uma seção parecida, será renomeada e ajustada para mostrar avaliação média (★ x.x).

## Sistema de votação 5 estrelas

Nova tabela `challenge_ratings` (user_id + challenge_id, rating 1-5). No card e na página do desafio: componente `<StarRating>`. Servidor calcula média via view ou agregação.

## Top 100 mensal (dia 10)

- Nova tabela `top100_snapshots` (month, user_id, challenges_count, total_participants, points, rank)
- pg_cron rodando dia 10 às 03:00 chama `/api/public/hooks/top100-snapshot`
- Fórmula de tokens por desafio criado:
  - 10 participantes: 4 tokens
  - 20: 10 tokens
  - 50: 20 tokens
  - 100: 50 tokens
  - 100+: 500 tokens
- Apenas participantes **cadastrados** contam
- Página `/top100` reescrita mostrando ranking do mês corrente + último snapshot fechado
- 1º lugar recebe destaque "Ganhador do mês" + chamada para prêmios

## Cadastro admin de prêmios

Nova rota `/admin/premios`:
- Tabela `admin_prizes`: nome, descrição, imagem (4:5), valor estimado, estoque, ativo
- Tabela `admin_prize_assignments`: liga prêmio a desafio + posição (1º/2º/...)
- CRUD completo
- Item no menu admin: "Conteúdo > Cadastrar Prêmios"

## Migrations

```sql
CREATE TABLE public.admin_prizes (...);
CREATE TABLE public.admin_prize_assignments (...);
CREATE TABLE public.challenge_ratings (...);
CREATE TABLE public.top100_snapshots (...);
-- GRANTs, RLS, policies para cada uma
-- pg_cron job dia 10
```

## Arquivos afetados

**Novos**
- `src/components/PrizesPicker.tsx` — modal seleção
- `src/components/CitiesAutocomplete.tsx` — IBGE
- `src/components/StarRating.tsx`
- `src/components/StepCard.tsx` — wrapper numerado com colapso/auto-expand
- `src/lib/admin-prizes.functions.ts`
- `src/lib/ratings.functions.ts`
- `src/lib/top100.functions.ts`
- `src/lib/cities-ibge.ts` (helper client fetch + debounce)
- `src/routes/admin.premios.tsx`
- `src/routes/api/public/hooks/top100-snapshot.ts`

**Editados**
- `src/routes/criar.tsx` — reestruturação completa em 8 steps
- `src/lib/user-challenges.ts` — novos campos (prizes[], cities[], openness, accepted_disclaimer)
- `src/routes/index.tsx` — seção "Criados pela comunidade" com avaliação
- `src/routes/top100.tsx` — ranking real do snapshot
- `src/routes/admin.tsx` — link "Cadastrar Prêmios" no menu Conteúdo
- `src/routes/previsao.$id.tsx` — exibir estrelas + permitir votar

## Detalhes técnicos

- Auto-avanço: cada step expõe `onComplete()`; o pai mantém `currentStep` e usa `scrollIntoView({behavior:"smooth"})` no próximo card
- Persistência local em rascunho (localStorage) para não perder progresso ao recarregar
- O popup de prêmios usa Dialog do shadcn, lista vem de server fn pública (com RLS `anon SELECT WHERE ativo=true`)
- Autocomplete IBGE: cache em memória da lista completa (~5500 itens, JSON ~400KB) buscada 1x e filtrada localmente após o primeiro fetch
- Tokens por participantes calculados na server fn de snapshot, não no cliente
