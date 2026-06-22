## Objetivo
Adicionar os 3 troféus enviados para destacar visualmente o 1º, 2º e 3º colocados nas telas de ranking.

## O que vou implementar

1. Preparar as 3 artes de troféu para web
- Otimizar as imagens para uso leve na internet
- Publicar como assets do projeto para carregarem rápido
- Manter proporção e boa definição para mobile e desktop

2. Criar um componente reutilizável de troféu por posição
- Componente para escolher automaticamente:
  - 1º lugar: troféu dourado
  - 2º lugar: troféu prata
  - 3º lugar: troféu bronze
- Aceitar tamanho menor para cards e maior para destaques

3. Aplicar nas telas onde o Top 3 já existe
- `src/routes/ranking.$challengeId.tsx`
  - substituir o ícone atual do bloco Top 3 pelo troféu real de cada posição
- `src/routes/ranking.tsx`
  - usar os troféus reais nos 3 cards do topo
- `src/routes/top100.tsx`
  - trocar os emojis/ícones do Top 3 pelos troféus enviados

4. Ajustar layout para não pesar visualmente
- No mobile, os troféus entram em tamanho contido
- No desktop, o 1º lugar pode ganhar mais destaque visual
- Preservar o estilo verde/dourado já existente

## Resultado esperado
Ao abrir ranking, ranking do desafio e Top 100, os três primeiros colocados aparecem com os troféus reais que você enviou, reforçando o pódio de forma mais forte e profissional.

## Detalhes técnicos
- Vou usar assets otimizados em vez dos PNGs pesados originais.
- A lógica do componente será por posição (`1`, `2`, `3`).
- Não vou mexer na regra do ranking, só na apresentação visual dos 3 primeiros.