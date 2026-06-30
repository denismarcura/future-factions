# Documentação técnica do projeto — Desafio dos Palpites

## 1. Visão geral

Este repositório é uma aplicação web full-stack em TypeScript para uma plataforma de palpites e gamificação chamada Desafio dos Palpites. A base da aplicação é um frontend React com TanStack Start (SSR/roteamento baseado em arquivos) e um backend de funções server-side integradas ao Supabase.

O sistema combina:
- páginas públicas de desafios, ranking, missões, shop, perfil e autenticação;
- área administrativa restrita para gestão de conteúdo, usuários, prêmios, campanhas e integrações;
- integração com Supabase para autenticação, banco de dados, storage e funções server-side;
- lógica de gamificação como missões, tokens, créditos de palpites, prêmios e ranking;
- integrações com IA (geração de desafios, busca semântica, textos de convite, regulamentos e análise anti-fraude);
- integração com dados de Copa do Mundo e resultados de partidas.

## 2. Stack tecnológica

### Frontend
- React 19
- TanStack Router
- TanStack Start
- TanStack React Query
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style component layer via Radix UI primitives
- lucide-react para ícones
- sonner para toasts
- date-fns, zod, react-hook-form
- recharts, embla-carousel, qrcode.react, vaul

### Backend / infra
- Supabase JS client
- Supabase Auth
- Supabase Postgres via migrations
- Supabase Storage
- server functions com createServerFn + middleware
- ambiente server-only com process.env e envs VITE_* para o cliente

### Ferramentas de build / lint / teste
- Vite
- ESLint + Prettier
- Vitest (instalado; há um teste de exemplo para instagram-handles)

## 3. Estrutura de diretórios

### Raiz
- package.json: scripts, dependências e versões.
- vite.config.ts: configuração do TanStack Start/Vite.
- tsconfig.json: configuração TypeScript com path alias @/*.
- components.json: configuração de aliases para componentes UI.
- eslint.config.js: regras de linting.
- bunfig.toml: política de release age para dependências.
- .env: variáveis de ambiente do projeto.
- supabase/config.toml: configuração do projeto Supabase.
- src/: código-fonte da aplicação.

### src/
- router.tsx: criação do router com QueryClient.
- routeTree.gen.ts: árvore de rotas gerada automaticamente pelo TanStack Router; não editar manualmente.
- server.ts: wrapper de entrada SSR com tratamento de erro.
- start.ts: configuração do start instance e middlewares.
- styles.css: estilos globais e tema Tailwind.

### Pastas principais
- src/routes/: rotas baseadas em arquivos. Cada arquivo .tsx vira uma rota.
- src/components/: componentes React reutilizáveis, incluindo layout e UI.
- src/components/ui/: componentes de interface base, em grande parte wrappers/estilos para shadcn/Radix.
- src/hooks/: hooks customizados.
- src/lib/: lógica de domínio, integrações e funções server-side.
- src/integrations/supabase/: cliente do Supabase, middleware de autenticação e tipos gerados.
- src/assets/: assets de imagem e banners usados pelo frontend.

## 4. Estratégia de roteamento

O projeto usa roteamento baseado em arquivos do TanStack Router. O arquivo principal da árvore é src/routeTree.gen.ts e é regenerado automaticamente. Não deve ser editado manualmente.

### Rotas públicas principais
- /: home/feed inicial.
- /desafios: listagem de desafios públicos, privados e corporativos.
- /previsao/$id: página de detalhe do desafio e fluxo de participação.
- /auth: autenticação (login/cadastro/recuperação de senha).
- /criar: criação de desafios (inclui criação de desafios corporativos e geração por IA).
- /missoes: listagem de missões e reclamação de recompensas.
- /ranking: ranking geral.
- /top100: top 100.
- /shop: loja de prêmios.
- /perfil: perfil do usuário.
- /faq, /termos, /como-funciona, /como-funcionam-os-tokens: páginas informativas.
- /empresas, /desafios-empresas, /convidar-amigos, /palpite-ia, /noticias, /amigo/$ref, /reset-password, /email-preferencias, /email-cancelar: fluxos específicos e páginas de marketing/convites.

### Rotas autenticadas/protegidas
- /_authenticated/dashboard: dashboard do usuário com perfil, missões, amizades, desafios, participações e estatísticas.

### Rotas administrativas
- /admin: layout administrativo com navegação interna.
- /admin/cadastros, /admin/empresas, /admin/convites, /admin/desafios, /admin/noticias, /admin/premios, /admin/categorias, /admin/banners, /admin/banners-inferiores, /admin/resultado-jogos, /admin/apuracao-copa, /admin/integracoes-futebol, /admin/missoes, /admin/bonus-login, /admin/raspadinha, /admin/loja, /admin/trocas, /admin/ranking, /admin/email-marketing, /admin/instagram-videos, /admin/notificacoes, /admin/regras-ia, /admin/apis, /admin/tokens-config, /admin/relatorios, /admin/seguranca.

### Rotas de API / webhooks
- /api/resend/webhook
- /lovable/email/queue/process
- /api/public/hooks/top100-snapshot
- /api/public/hooks/football-sync
- /api/public/hooks/apurar-copa

## 5. Componentes principais

### Layout e navegação
- src/components/layout/AppShell.tsx: shell principal da aplicação com header, navegação, menu mobile, footer e alertas de encerramento.
- src/components/layout/Footer.tsx: rodapé. (Arquivos existem na pasta layout; o componente principal foi inspecionado via AppShell.)

### Componentes de domínio
- src/components/PredictionCard.tsx: card de desafio com status, imagem, opções e CTA de participação.
- src/components/NextChallengeBanner.tsx: CTA para criar o próximo desafio após encerramento.
- src/components/HeaderSearch.tsx: busca global com resultados de desafios corporativos, desafios mock e usuários.
- src/components/InviteLinkCard.tsx: link de convite com cópia, compartilhamento e QR Code.
- src/components/ArtsWizard.tsx: fluxo guiado para geração/seleção de artes de desafios corporativos.
- src/components/CitiesAutocomplete.tsx: autocomplete de cidades.
- src/components/CitiesScopePicker.tsx: seleção de escopo geográfico.
- src/components/PrizesPicker.tsx: seleção de prêmios.
- src/components/ClosingSoonAlert.tsx, ClosingTimerBadge.tsx, CountdownTimer.tsx: componentes de contagem regressiva.
- src/components/LiveUsersBadge.tsx, GoogleReviewsSlider.tsx, MissionsTeaser.tsx, EarnMorePointsCTA.tsx, TrophyBadge.tsx, StepCard.tsx, StarRating.tsx, PalpiteCreditsBadge.tsx: elementos de gamificação e marketing.

### Componentes de UI base
- src/components/ui/: wrappers e componentes de interface, incluindo dialog, sheet, tabs, buttons, badges, cards, dropdowns e outros elementos reutilizáveis.

## 6. Hooks customizados

### useAuth
- Localiza e expõe sessão/usuário do Supabase.
- Escuta mudanças de autenticação via onAuthStateChange.
- Usa supabase.auth.getSession() para inicializar estado.

### useInviteUrl
- Gera URL de convite baseada no usuário e no perfil.
- Usa o perfil do usuário quando disponível e faz fallback para slug de convite.

### useIsMobile
- Detecta viewport móvel via matchMedia.

### useParticipatedChallengeIds
- Combina participação local (localStorage) com palpites remotos no Supabase.
- Escuta eventos de atualização para recalcular conjunto de IDs já participados.

## 7. Lógica principal de domínio

### Desafios e palpites
- Os desafios são exibidos em páginas públicas e na página de detalhe.
- O fluxo de participação usa localStorage para registrar participações locais e, quando autenticado, também pode persistir no Supabase via funções do domínio.
- A página /previsao/$id suporta desafios simples, desafios com sub-palpites, missões corporativas associadas e resultados de partidas.

### Gamificação
- Missões: listagem, claim, tokens e bônus.
- Créditos de palpites: mecanismo adicional para participar de desafios com créditos.
- Tokens: cálculo de saldo com base em boas-vindas, missões, participações e resgates.
- Ranking: estrutura de ranking por desafio e dados de vencedores.

### Conteúdo e marketing
- Notícias, categorias e subcategorias.
- Campanhas de e-mail marketing e filas de envio.
- Banners, artes e promoções.
- Link de convite, QR Code e compartilhamento.

## 8. Integração com Supabase

### Cliente principal
- src/integrations/supabase/client.ts cria um cliente do Supabase usando VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no frontend.
- O client usa localStorage para persistir sessão no navegador.

### Cliente server-side admin
- src/integrations/supabase/client.server.ts cria um cliente com service role key para operações server-side confiáveis.

### Middleware de autenticação
- src/integrations/supabase/auth-attacher.ts injeta o bearer token nas server functions do cliente.
- src/integrations/supabase/auth-middleware.ts valida o token nas server functions do servidor e preenche context com userId e claims.

### Ambiente esperado
- O projeto espera as variáveis:
  - SUPABASE_URL
  - SUPABASE_PUBLISHABLE_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server-side)
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
  - LOVABLE_API_KEY para recursos de IA

## 9. Banco de dados e migrações do Supabase

As migrações estão em supabase/migrations/. Elas definem tabelas, políticas RLS, triggers e extensões para o backend do projeto.

### Estruturas principais verificadas
- profiles: perfil do usuário, dados cadastrais, bonus de boas-vindas, CPF, WhatsApp, Instagram, status, etc.
- user_roles: papéis de usuário, incluindo admin.
- signup_attempts: tentativa de cadastro, IP e cidade.
- missions / mission_claims: missões e registro de conclusão.
- challenges / palpites / challenge_results_log / challenge_winners: desafios e resultados.
- corporate_challenges: desafios de empresas com subperguntas, prêmios, missões, artes, status e participantes.
- challenge_categories / challenge_subcategories: categorias e subcategorias para a criação de desafios.
- admin_prizes: catálogo de prêmios administráveis.
- prize_redemptions: resgates de prêmios, status, análise anti-fraude e notas de admin.
- world_cup_results: resultados de jogos da Copa do Mundo e status.
- email_contacts / email_preferences / email_templates / email_campaigns / email_campaign_logs / email_events / email_queue: infra de e-mail marketing.
- instagram_submissions: submissões de vídeos/insta para validação.
- news_categories / news_subcategories / news_articles / news_ratings: módulo de notícias.
- football_competitions / football_matches / football_sync_logs: integrações de futebol.
- mystery_box_opens: rastreamento de abertura de caixa misteriosa.
- palpite_credit_transactions: registro de transações de créditos de palpites.

### Observações sobre o banco
- O schema usa Row Level Security (RLS) em várias tabelas.
- Há políticas específicas para usuários, admins e service role.
- O projeto depende fortemente de funções SQL/ RPCs como has_role e grant_palpite_credit, além de triggers e atualizações automáticas.

## 10. Funções server-side e módulos de negócio

### Administração
- src/lib/admin.functions.ts: validação de admin e promoção inicial do primeiro admin.
- src/lib/admin-data.functions.ts: listagem e gestão administrativa de perfis e desafios corporativos.
- src/lib/admin-prizes.functions.ts: gestão de prêmios.
- src/lib/admin-stats.functions.ts: estatísticas administrativas.

### Corp challenges / empresas
- src/lib/corp-challenges.functions.ts: CRUD e busca de corporate challenges, com normalização de missões e leitura pública.
- src/lib/corp-storage.ts: upload de assets para desafios corporativos.

### IA
- src/lib/search-ai.functions.ts: busca semântica de desafios com IA.
- src/lib/challenge-ai.functions.ts: geração de perguntas, melhora de descrição, WhatsApp invite, tiebreaker e regulamentos.
- src/lib/ai-gateway.server.ts: provider para o gateway da Lovable AI.
- src/lib/invite-ai.functions.ts, title-ai.functions.ts, prize-image.functions.ts, banner-from-prize.functions.ts: uso de IA para títulos, convites e artes.

### Missões e gamificação
- src/lib/missions.ts: listagem, claim, contexto e regras de missões.
- src/lib/palpite-credits.functions.ts: gestão de créditos de palpites.
- src/lib/balance.ts: cálculo de saldo de tokens.
- src/lib/palpite-tokens.ts: lógica de palpite tokens.
- src/lib/token-history.ts: histórico de tokens.

### Participação e ranking
- src/lib/my-participations.ts: localStorage para participações.
- src/lib/my-palpites.functions.ts: consulta de palpites do usuário.
- src/lib/challenge-ranking.functions.ts: ranking de desafio com tiebreak.
- src/lib/ratings.functions.ts: avaliações de desafios.

### Autenticação e convites
- src/lib/signup.functions.ts: preparação de signup com limite por IP e geolocalização.
- src/lib/invite-link.ts: geração de slug e URL de convite.
- src/lib/friend-profile.functions.ts: dados de convite compartilhado.
- src/lib/friends.ts: gestão de amigos/invites.

### Conteúdo, e-mail e integração esportiva
- src/lib/news.functions.ts, challenge-emails.functions.ts, challenge-invites.functions.ts, email-marketing.functions.ts.
- src/lib/world-cup-results.functions.ts e world-cup-results-client.ts: integração com resultados de partidas.
- src/lib/football-data.server.ts, football-integrations.functions.ts, football-sync.server.ts: integração esportiva mais ampla.
- src/lib/instagram-submissions.functions.ts: submissão e validação de conteúdos do Instagram.

## 11. Dados mockados e conteúdos de exemplo

O projeto não depende apenas do Supabase. Ele também carrega dados locais e mocks para alimentar a UI quando necessário.

### Arquivos importantes
- src/lib/mock-data.ts: catálogo de desafios mockados, categorias e estrutura de Prediction.
- src/lib/mock-extra.ts: dados extra para desafios e produtos.
- src/lib/mock-users.ts: usuários fictícios para feed e ranking.
- src/lib/world-cup-matches.ts: lista de jogos e dados da Copa do Mundo.
- src/lib/palpites-malucos.ts, src/lib/desafios-diamante.ts, src/lib/world-cup-matches.ts: conjuntos de desafios temáticos.

### Importante
- A aplicação parece ser um mix de dados reais (Supabase) e dados locais/temporários para experiência de produto e testes. Isso é visível em páginas como /desafios e /index, que combinam dados mock com resultados vindos de Supabase.

## 12. Arquivos de configuração

### package.json
- scripts: dev, build, preview, lint, format.
- dependências principais: TanStack, Supabase, Radix, AI SDK, Tailwind, lucide-react, sonner, recharts, zod.

### tsconfig.json
- target ES2022, JSX react-jsx, moduleResolution Bundler.
- paths: @/* -> ./src/*.

### vite.config.ts
- usa a configuração pronta do Lovable/Vite TanStack e redireciona o entry server para src/server.ts.

### components.json
- aliases do shadcn/ui.

### eslint.config.js
- regras de React hooks, refresh e TypeScript; ignora dist/.output/.vinxi.

### bunfig.toml
- define uma política de minimumReleaseAge para instalação de dependências.

### supabase/config.toml
- aponta para o projeto Supabase configurado no repositório.

## 13. Dependências e integrações externas

### Dependências principais
- @tanstack/react-router e @tanstack/react-start
- @supabase/supabase-js
- @ai-sdk/openai-compatible e ai
- @radix-ui/react-* (primitives UI)
- recharts, embla-carousel, qrcode.react
- tailwindcss, class-variance-authority, clsx, tailwind-merge

### Serviços externos usados
- Supabase Auth e Database
- Supabase Storage
- Lovable AI gateway (via LOVABLE_API_KEY)
- ipapi.co em signup.functions.ts para geolocalização de IP
- assets e imagens externas possivelmente usadas por dados de desafio e categorias

## 14. Fluxos de usuário observados

### Cadastro e login
- Autenticação via Supabase Auth.
- Cadastro com validação de CPF, WhatsApp, Instagram, aceite de termos e marketing opt-in.
- Preparação de signup com limite por IP e lookup de cidade.
- Upload de avatar pendente antes da confirmação de e-mail.

### Criação de desafio
- Fluxo rico com categoria, subcategoria, perguntas, opções, prêmio, datas, missão social, banner/logo e geração por IA.
- Criação de desafio corporativo com perguntas, regulamento, critérios de desempate, missões e artes.
- Envio de e-mails e convites após publicação.

### Participação
- Usuário entra em uma página de desafio, escolhe opção, define valor/entrada e participa.
- O sistema usa tanto persistência local quanto persistência no Supabase.
- Há suporte a missões sociais e créditos de palpites a partir de missão concluída.

### Dashboard
- Exibe perfil, missões, lista de amigos, desafios próprios, participações e histórico de palpites.

## 15. Pontos importantes de implementação

### Padrões adotados
- Server functions ficam em src/lib e usam createServerFn.
- Rotas e componentes são organizados por responsabilidade.
- Middlewares de autenticação concentram a segurança de funções server-side.
- Dados reais e mocks convivem no mesmo produto.

### Regras de manutenção observadas no código
- src/routeTree.gen.ts é automaticamente gerado; não editar manualmente.
- src/integrations/supabase/client.ts e auth-attacher.ts são gerados/automatizados; não editar diretamente quando possível.
- A aplicação usa SSR e server functions do TanStack Start; o backend não é um serviço REST tradicional isolado.

## 16. Funcionalidades que existem no projeto

- Autenticação com Supabase.
- Feed de desafios, desafios públicos e corporativos.
- Detalhe de desafio e participação.
- Ranking, top 100 e perfil.
- Criação de desafios com IA.
- Missões e recompensas.
- Sistema de prêmios e resgates.
- Busca por desafios corporativos e busca semântica por IA.
- Admin com múltiplas páginas e operações.
- E-mail marketing e filas de envio.
- Integração com resultados de futebol e Copa do Mundo.
- Convites, link de convite e QR Code.

## 17. Funcionalidades ou lacunas observadas

As seguintes observações são baseadas apenas no que foi encontrado no repositório:

- Não há um README geral de alto nível no repositório raiz; há apenas documentação de rotas em src/routes/README.md.
- Há um teste de exemplo para instagram-handles, mas não foi encontrado um script de testes explícito em package.json.
- O projeto contém muitas funções de IA e integrações, mas o uso real dessas funções depende de variáveis de ambiente como LOVABLE_API_KEY e de configuração do Supabase.
- Existe uma camada de dados mockada para alimentar a experiência; isso não significa que toda a aplicação esteja 100% dependente do banco.
- O projeto usa arquivos gerados para rotas e integrações; alterações nesses arquivos devem ser feitas com cuidado para evitar sobrescrita.

## 18. Regras práticas para futuras alterações

- Prefira seguir o padrão já adotado por routes, hooks, lib e server functions.
- Ao alterar esquemas ou tabelas do Supabase, acompanhe as migrations e os tipos em src/integrations/supabase/types.ts.
- Para operações sensíveis, use as server functions e o middleware de autenticação já existentes.
- Para recursos de IA, trate LOVABLE_API_KEY como obrigatório em runtime.
- Para rotas e árvore de rotas, respeite o fluxo do TanStack Router e não edite routeTree.gen.ts manualmente.
