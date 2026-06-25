## Problema

A página `/perfil` (`src/routes/perfil.tsx`) hoje usa apenas dados mockados (`CURRENT_USER`, `PREDICTIONS` de `mock-data`). Por isso não aparecem os desafios reais que o usuário participou nem os palpites acertados — mesmo quando ele já submeteu palpites de verdade na base (`public.palpites`).

Já existe um server fn pronto que retorna os palpites do usuário autenticado: `listMyPalpites` em `src/lib/my-palpites.functions.ts` (campos `id`, `challenge_id`, `is_correct`, `evaluated_at`, `created_at`). Vou usar ele e cruzar com a tabela `challenges` para mostrar título, categoria e link.

## O que vou alterar (somente apresentação no perfil — sem cobrar tokens, sem nova lógica de negócio)

1. **`src/routes/perfil.tsx`**
   - Buscar os palpites reais do usuário via `useServerFn(listMyPalpites)` dentro de um `useQuery` (key: `["my-palpites", userId]`).
   - Buscar os desafios correspondentes (`challenges.id, title, category, status, closes_at, banner_url`) com o cliente Supabase do browser, filtrando por `in("id", challengeIds)`.
   - Calcular métricas reais a partir do retorno:
     - **Participações**: total de palpites distintos por `challenge_id`.
     - **Acertos**: `is_correct === true`.
     - **Erros**: `is_correct === false`.
     - **Pendentes**: `is_correct === null` (ainda não apurado) — exibido como badge "aguardando resultado".
     - **Taxa**: acertos / (acertos+erros) quando houver avaliados.
   - Substituir os KVs hardcoded (`u.acertos`, `u.erros`, "#1.482") pelos valores reais. Tokens continuam vindo do hook existente de saldo (sem novas cobranças).

2. **Nova seção "Desafios que participei"**
   - Lista os desafios reais do usuário com:
     - Título, categoria, data do palpite.
     - Status visual: ✅ Acertou / ❌ Errou / ⏳ Aguardando resultado.
     - Link para `/previsao/$id` (somente leitura do palpite já enviado).
   - Acima, sub-aba "Acertei" filtrando `is_correct === true`.

3. **Seção mockada "Suas previsões"** é removida (era `PREDICTIONS.slice(0, 4)` — desafios fictícios).

4. **Estados de UI**
   - Loading skeleton enquanto carrega.
   - Empty state amigável: "Você ainda não participou de nenhum desafio. [Ver desafios abertos]".
   - Mantém `InviteLinkCard` e Conquistas como estão.

## Sobre os tokens cobrados

Não consigo estornar tokens diretamente pelo chat — isso depende do suporte da Lovable. O que faço neste plano é **apenas corrigir o que está faltando aparecer** no perfil; não toco em nenhum fluxo de cobrança ou criação de desafio, então não há débito adicional pelo lado do produto. Se quiser, te ajudo a redigir uma mensagem para o suporte pedindo análise do estorno.

## Detalhes técnicos

- `listMyPalpites` já existe e usa `requireSupabaseAuth` — o bearer é anexado automaticamente pelo `functionMiddleware` registrado no `src/start.ts`.
- A rota `/perfil` é pública hoje; vou manter (sem gate), e dentro do componente: se `useAuth()` não tiver usuário, mostro CTA "Entrar para ver seu histórico" em vez de chamar o server fn.
- Sem migrações de banco. Sem novos endpoints. Sem mudanças em `criar.tsx` ou fluxos pagos.

## Fora do escopo

- Estorno de tokens (precisa do suporte Lovable).
- Mudanças em `desafios.tsx` / `index.tsx` (a participação já é ocultada por lá via `useParticipatedChallengeIds`).
