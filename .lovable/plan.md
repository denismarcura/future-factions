# Reorganização do widget de desafio + missões sequenciais

Página: `src/routes/previsao.$id.tsx` (lado direito do desafio com `subPredictions`, ex.: `/previsao/wc-23a`).

## 1. Inverter a ordem do widget direito

Hoje: título → custo → contagem → premiação → botão verde no fim.

Novo (estilo do print, mais limpo, verde chamativo no topo):

```text
┌─────────────────────────────┐
│  [ PARTICIPAR POR 100 TKN ] │  ← botão verde grande, primeiro
│  Seu saldo: 700 TKN         │
├─────────────────────────────┤
│  Custo de entrada           │
│  100 TKN                    │
│  Palpites preenchidos  0/5  │
│  Seu saldo         1.2k TKN │
│                             │
│  Premiação                  │
│  5 acertos     10.000 TKN   │
│  4 acertos      5.000 TKN   │
│  3 acertos      2.000 TKN   │
└─────────────────────────────┘
```

- Botão verde sólido bem chamativo (estilo Instagram: cor cheia + sombra glow + tracking forte). Mantém o gradiente da marca mas com mais peso (h-14, ring verde, hover scale).
- Selo "✓ PARTICIPAÇÃO CONFIRMADA" quando `confirmed=true` (igual hoje).
- Toda lógica de débito/validação/`saveParticipation` permanece intacta.

## 2. Numerar os palpites bônus

Já existe `1. … 5.` na coluna de palpites principais. O pedido aqui é numerar **os palpites extras** ganhos via missão. Cada palpite bônus liberado aparece numerado: "Palpite extra #6", "Palpite extra #7"…, abaixo dos 5 originais, formando uma seção "Palpites extras" abaixo do bloco principal de palpites. Visualmente: card pequeno marcando ✅ "Palpite extra Nº 6 liberado por missão Instagram".

## 3. Sequência de missões (só desbloqueia após participar)

### Estado bloqueado (antes de clicar em Participar)

O card de missão (hoje "Palpite extra grátis — Instagram") fica **desativado** com cadeado e texto: "Confirme sua participação para desbloquear missões bônus".

### Fluxo desbloqueado

Após `confirmed=true`, vira uma trilha de 4 missões, **uma de cada vez**, na ordem:

```text
1. Instagram   →  2. YouTube  →  3. Facebook  →  4. TikTok
```

Cada etapa:

1. Mostra apenas a missão **atual** + as anteriores marcadas como ✅ "Missão feita".
2. Botão temático da plataforma (Instagram rosa/laranja gradient, YouTube vermelho, Facebook azul, TikTok preto) — reaproveita os tokens em `src/styles.css` (`--gradient-instagram`, `--gradient-youtube`, `--gradient-facebook`, `--gradient-tiktok`) já criados no dashboard.
3. Ao clicar: abre o link em nova aba (igual hoje) e **inicia um timer de 5s** no card com loader + "Validando missão…".
4. Após 5s: texto muda para **"✅ Missão feita — +1 palpite extra liberado!"**, incrementa contador de palpites extras, persiste via `claimMission(...)` (lógica existente), e **revela** automaticamente o próximo card (YouTube → Facebook → TikTok).
5. Quando as 4 forem concluídas: badge "🏆 Todas as missões concluídas — +4 palpites extras!"

### Estado local (no `PredictionPage`)

- `missionStep: 0..4` (0 = Instagram pendente, 4 = todas feitas).
- `missionStatus: 'idle' | 'verifying' | 'done'` da missão atual.
- `extraPalpites: number` — incrementado em cada missão concluída.
- Persistência simples em `localStorage` por `challenge:${p.id}` para sobreviver a refresh (igual ao padrão atual de `my-participations`).

## 4. Detalhes técnicos

- Arquivo único alterado: `src/routes/previsao.$id.tsx`.
- Buscar uma missão por plataforma usando `listMissions({ platform, activeOnly: true })` + `pickRandomFor` (já existe). Carregar as 4 ao montar.
- Se alguma plataforma não tiver missão cadastrada, pula essa etapa silenciosamente.
- Mantém `handleBonusClaim` mas adapta para receber a missão da etapa atual e disparar o timer de 5s antes de marcar `done`.
- O bloco "⚡ Ganhe mais chances" (Fazer missões / Convidar amigos) **continua** abaixo, sem mudança.
- Sem mudanças de backend, schema, ou outras rotas.

## Fora de escopo

- Verificação real por IA se o usuário seguiu (você pediu isso antes — fica para depois; aqui é só o timer de 5s simulando validação).
- Aplicar o mesmo fluxo em desafios sem `subPredictions` (continuam como estão).
