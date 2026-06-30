# Instruções para outras IAs

Este projeto é uma aplicação TanStack Start + React + TypeScript para um produto de palpites e gamificação. Antes de alterar qualquer comportamento, leia primeiro a estrutura existente em src/routes, src/lib, src/components e src/integrations/supabase.

## O que é este projeto
- Plataforma de desafios, palpites, ranking, missões, loja, prêmios e administração.
- Usa Supabase para autenticação, banco, storage e regras de acesso.
- Usa server functions do TanStack Start em src/lib para lógica de negócio.
- Tem integração com IA para criação de desafios, busca, textos de convite, regulamentos e análise anti-fraude.

## Regras importantes
- Respeite o padrão de rotas baseado em arquivos do TanStack Router.
- Não edite routeTree.gen.ts manualmente.
- Para mudanças de banco, acompanhe as migrations no diretório supabase/migrations.
- Para mudanças sensíveis, prefira as funções server-side já existentes em src/lib.
- Não assuma que tudo é Supabase; há dados mockados em src/lib para alimentar a UI.
- Para recursos de IA, considere LOVABLE_API_KEY e o gateway em src/lib/ai-gateway.server.ts.

## Estrutura de pastas relevante
- src/routes/: telas e rotas do app.
- src/components/: componentes reutilizáveis.
- src/hooks/: hooks customizados.
- src/lib/: regras de negócio e integrações.
- src/integrations/supabase/: clientes e middleware do Supabase.

## Comportamentos esperados
- O app possui fluxo público e fluxo autenticado.
- Há uma área administrativa com múltiplas páginas.
- Há gamificação com missões, créditos de palpites e prêmios.
- Há páginas de marketing e convite, além de integração com resultados esportivos.

## Prioridade ao editar
1. Entender o fluxo atual antes de mudar.
2. Reutilizar componentes e funções já existentes.
3. Manter compatibilidade com Supabase e TanStack Start.
4. Evitar mudanças invasivas sem contexto do domínio.
