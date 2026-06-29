# Trocar envio de e-mails para Resend (chave gerenciada no admin)

## Objetivo
A página `/admin/apis` hoje é só visual — não salva nada. Vou torná-la funcional para a chave do Resend e migrar todos os disparos (convite de amigos, convites de desafios e e-mails de desafio) para usar a API do Resend diretamente, em vez da fila interna `enqueue_email`.

## O que será feito

### 1. Persistência da chave no admin
- Nova tabela `public.app_settings (key text PK, value jsonb, updated_at)` com RLS:
  - SELECT/INSERT/UPDATE somente para `admin` (via `has_role`).
  - GRANTs para `authenticated` e `service_role`.
- Server functions (em `src/lib/admin-settings.functions.ts`):
  - `getAdminSetting({ key })` — admin-only, devolve `{ value }`.
  - `saveAdminSetting({ key, value })` — admin-only, faz upsert.
- A chave do Resend fica em `app_settings` com key `resend` e valor `{ apiKey, from }`. **Não** será gravada como secret do projeto — fica no banco para o admin poder rotacionar pela UI a qualquer momento.

### 2. UI `/admin/apis` funcional (apenas card Resend nesta entrega)
- Carrega valores existentes ao abrir.
- Botão "Salvar chave" grava de verdade via `saveAdminSetting`.
- Botão "Testar envio" que dispara um e-mail de teste para o e-mail do admin logado (usa a chave recém-salva).
- Badge "Conectado" reflete o estado real.
- Cards de ChatGPT e Maritaca seguem cosméticos por enquanto (fora do escopo do pedido).

### 3. Cliente Resend server-side
- Novo helper `src/lib/resend.server.ts` com `sendEmailViaResend({ to, subject, html, from? })`:
  - Lê a chave do `app_settings` (via `supabaseAdmin`).
  - Faz `POST https://api.resend.com/emails`.
  - Lança erro com a mensagem real do Resend quando falha (para aparecer no toast).
  - Registra cada envio em `email_send_log` (tabela já existe) com status/erro.

### 4. Migração dos disparos atuais
Trocar `enqueue_email` por `sendEmailViaResend` em:
- `src/lib/friend-invite-emails.functions.ts` (convite a amigos por e-mail).
- `src/lib/challenge-invites.functions.ts` (convites de participantes de desafios).
- `src/lib/challenge-emails.functions.ts` (notificações de desafio).
- `src/lib/result-email.functions.ts` se usar a fila (verificar e migrar se for o caso).

A fila `pgmq` e os workers existentes não são removidos nesta entrega — apenas deixam de ser alimentados pelos fluxos acima.

### 5. Validações
- Se a chave do Resend não estiver configurada, os fluxos de e-mail retornam erro claro: "Configure a chave do Resend em /admin/apis".
- Remetente padrão (`from`) cai para `Desafio dos Palpites <no-reply@desafiodospalpites.com.br>` quando o campo não for preenchido.

## Detalhes técnicos
- A chamada ao Resend é feita direto via `fetch` (sem SDK) para evitar dependências pesadas no Worker.
- Toda função que envia e-mail é `createServerFn` com `requireSupabaseAuth` + verificação `has_role('admin')` quando aplicável (testes/admin); o disparo de convite de amigos continua disponível para qualquer usuário autenticado (já é hoje).
- Como o domínio `desafiodospalpites.com.br` já está verificado no Resend pelo usuário, o `from` pode usar esse domínio sem cair em sandbox.

## Fora do escopo
- Reescrever os workers/fila `pgmq` existentes.
- Cards ChatGPT/Maritaca da página `/admin/apis` (continuam visuais).
- Templates de e-mail de Auth do Supabase (esses seguem pelo provedor de auth).
