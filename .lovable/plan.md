## Problema

Em `src/routes/_authenticated/dashboard.tsx` a mesma constante alimenta os textos do WhatsApp, do e-mail, o "Link para incluir na postagem" **e o QR Code**:

- Linha 1568: `const SITE_URL = "https://desafiodospalpites.com.br";` → falta `www.` (domínio oficial é `www.desafiodospalpites.com.br`).
- Linhas 1300 e 1579: `const refCode = (userId || "").slice(0, 8) || "amigo";` → quando `userId` ainda não carregou, o link sai como `?ref=amigo` (literal).
- O QR Code (linha 1816) usa o mesmo `link`, então mostra a URL errada e o arquivo baixado vira `qrcode-convite-amigo.png`.

## Correções

1. **Domínio**: trocar `SITE_URL` para `"https://www.desafiodospalpites.com.br"`.

2. **Ref code**: remover o fallback `"amigo"`. Criar helper `buildReferralLink(userId)`:
   - Com `userId` → `${SITE_URL}/auth?ref=${userId.slice(0, 8)}`.
   - Sem `userId` → `${SITE_URL}/auth` (sem `?ref=`).

3. **Esperar `userId`** antes de gerar textos e QR: enquanto não houver `userId`, mostrar placeholder "Carregando link de convite..." nos blocos:
   - "Texto para WhatsApp"
   - "Texto para e-mail"
   - "Link para incluir na postagem"
   - "Seu QR Code de convite" (desativa o botão Baixar/Copiar até ter o link válido)

4. **Centralizar**: extrair `SITE_URL` + `buildReferralLink` para o topo do arquivo, eliminando a duplicação entre as linhas 1301 e 1580 (e o uso no QR).

## Arquivo afetado

- `src/routes/_authenticated/dashboard.tsx` — linhas ~1300, 1568, 1579–1583, 1810–1816.

## Fora do escopo

- Não muda o visual dos blocos.
- Não muda os textos prontos (apenas o link dentro deles).
- Não muda a geração da imagem do QR em si — herda o link correto automaticamente.
