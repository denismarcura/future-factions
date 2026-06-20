## Melhorias no formulário de Banner (Admin)

### 1. Botão "Gerar título com IA"
- No campo **Título**, adicionar um botão ✨ ao lado.
- Reutiliza o server function existente `generateBannerTitle` (em `src/lib/title-ai.functions.ts`) — se não existir um endpoint adequado, criar `generateBannerTitle` usando o gateway Lovable AI (mesmo padrão de `challenge-ai.functions.ts`).
- O prompt usa como contexto: subtítulo, desafio vinculado (se houver) e CTA. Retorna um título curto e chamativo (máx ~60 caracteres).
- Estado de loading no botão, toast de erro em falha.

### 2. Busca para vincular banner a um Desafio
- Novo campo **"Vincular ao desafio"** no formulário.
- Input de busca com autocomplete (Command/Popover do shadcn) listando desafios cadastrados via `listUserChallenges()` + `desafiosDiamante` + mock destacados.
- Ao selecionar, preenche automaticamente `ctaLink` com `/previsao/{id}` e oferece preencher `ctaLabel` ("Participar") se vazio.
- Mostra chip do desafio selecionado com botão de remover; permanece editável manualmente caso o admin queira um link externo.
- Persistir `challengeId` opcional no tipo `Banner` (`src/lib/banners.ts`) para exibir o vínculo na listagem.

### 3. Listagem
- Mostrar o título do desafio vinculado abaixo do CTA quando houver.

### Arquivos afetados
- `src/lib/banners.ts` — adicionar campo opcional `challengeId`.
- `src/lib/title-ai.functions.ts` — adicionar `generateBannerTitle` se ainda não existir.
- `src/routes/admin.banners.tsx` — UI do botão IA, combobox de busca e exibição na lista.

Sem alterações no backend/DB (banners seguem em localStorage como hoje).