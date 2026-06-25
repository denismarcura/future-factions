## Objetivo
Adicionar um QR Code do link de convite simples (`dominio.com.br/{slug}`) no componente `InviteLinkCard`, para que apareça automaticamente em Missões, Perfil e demais lugares onde o cartão de convite é exibido.

## Mudanças

### 1. `src/components/InviteLinkCard.tsx`
- Instalar/usar a lib `qrcode.react` (já comum no projeto; se não houver, adicionar).
- Logo abaixo do campo do link e dos botões de copiar/compartilhar, exibir:
  - Um QR Code (160px) gerado a partir do `inviteUrl`.
  - Botão **"Baixar QR Code"** que exporta o SVG/PNG como `meu-convite-desafio.png`.
  - Botão **"Compartilhar"** (usa Web Share API quando disponível, fallback para copiar).
- Estado de loading enquanto `useInviteUrl` resolve.
- Layout responsivo: em mobile, QR centralizado acima dos botões; em desktop, lado-a-lado com o link.

### 2. Verificação
- Confirmar que aparece em `/missoes` e `/perfil` (já usam `InviteLinkCard`).
- Garantir que o QR aponta para o link limpo (`buildInviteUrlFromProfile`) e não para a rota antiga `/amigo/...`.

## Detalhes técnicos
- Renderizar com `<QRCodeCanvas />` para permitir download direto via `canvas.toDataURL("image/png")`.
- Nenhuma mudança em backend, rotas ou cobrança de tokens.
- Sem alteração no `dashboard.tsx` (já possui seu próprio QR), apenas no card compartilhado.
