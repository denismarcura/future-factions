## Diagnóstico

O erro mostrado no print vem do backend: a missão tenta gravar em `mission_claims`, mas a política atual só permite salvar quando `tokens_awarded` é exatamente igual a `missions.tokens`.

A tela agora envia `tokens_awarded = missão + bônus + 50`, então a regra bloqueia com: `new row violates row-level security policy for table "mission_claims"`.

Também há um segundo problema de experiência: o link externo precisa abrir imediatamente no clique, antes do cronômetro/claim, para não ser bloqueado pelo navegador ou pelo iframe do preview.

## Plano de correção

1. Ajustar a regra de segurança de `mission_claims` para permitir o valor correto:
   - `missions.tokens + missions.bonus_tokens + 50`
   - somente para o próprio usuário logado
   - somente para missões ativas

2. Manter a leitura restrita:
   - cada usuário continua vendo apenas as próprias missões concluídas.

3. Ajustar o botão `Fazer` em `/missoes` para abrir o Instagram/YouTube/TikTok/Facebook imediatamente:
   - abrir com `window.open(m.link, "_blank", "noopener,noreferrer")` no início do clique
   - depois iniciar a barra de verificação de 5 segundos
   - se o pop-up for bloqueado, mostrar toast orientando o usuário a permitir pop-ups.

4. Melhorar a mensagem de erro:
   - se o registro da missão falhar, parar a barra verde e mostrar um toast claro sem deixar o card preso em “verificando”.

## Arquivos/Backend afetados

- Backend: política de `mission_claims`
- Frontend: `src/routes/missoes.tsx`

Não vou mexer em tokens cobrados, desafios, ranking ou outras áreas.