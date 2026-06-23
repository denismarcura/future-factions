import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  match_date: string;
  image_url?: string | null;
};

type Output = {
  subject: string;
  intro: string;
  html: string;
};

const PRODUCTS = [
  { name: "Voucher Uber R$50", cost: 6500, emoji: "🚗", tier: "Barato" },
  { name: "Tênis Nike Air Max", cost: 95000, emoji: "👟", tier: "Médio" },
  { name: "iPhone 17 Pro Max", cost: 500000, emoji: "📱", tier: "TOP" },
];

function buildHtml(opts: {
  intro: string;
  user: { name: string; tokens: number; nextRewardAt: number };
  match: Input;
  hits: { q: string; user: string; correct: string; points: number; ok: boolean }[];
  totalPoints: number;
  closingSoon: { title: string; closesIn: string; prize: string }[];
}) {
  const { intro, user, match, hits, totalPoints, closingSoon } = opts;
  const progress = Math.min(100, Math.round((user.tokens / user.nextRewardAt) * 100));
  const remaining = Math.max(0, user.nextRewardAt - user.tokens);

  const hitsRows = hits
    .map(
      (h) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #1f2937;color:#cbd5e1;font-size:14px">${h.q}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1f2937;color:#94a3b8;font-size:13px">${h.user}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1f2937;color:#94a3b8;font-size:13px">${h.correct}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1f2937;text-align:right;font-weight:800;font-size:14px;color:${h.ok ? "#22c55e" : "#ef4444"}">${h.ok ? "+" + h.points : "0"}</td>
      </tr>`,
    )
    .join("");

  const productCards = PRODUCTS.map(
    (p) => `
      <td width="33%" valign="top" style="padding:8px">
        <div style="background:#0b1220;border:1px solid #1f2937;border-radius:14px;padding:16px;text-align:center">
          <div style="font-size:36px;line-height:1">${p.emoji}</div>
          <div style="font-size:11px;color:#a78bfa;letter-spacing:2px;margin-top:6px;font-weight:800">${p.tier}</div>
          <div style="font-size:13px;color:#e2e8f0;margin-top:6px;font-weight:700;min-height:34px">${p.name}</div>
          <div style="margin-top:10px;font-size:14px;font-weight:900;color:#fde047">${p.cost.toLocaleString("pt-BR")} 🪙</div>
        </div>
      </td>`,
  ).join("");

  const closingCards = closingSoon
    .map(
      (c) => `
      <td width="33%" valign="top" style="padding:8px">
        <div style="background:linear-gradient(135deg,#7c3aed22,#22d3ee22);border:1px solid #7c3aed55;border-radius:14px;padding:14px">
          <div style="font-size:10px;color:#fca5a5;font-weight:800;letter-spacing:1.5px">⏰ ${c.closesIn}</div>
          <div style="font-size:14px;color:#f8fafc;margin-top:6px;font-weight:700;line-height:1.3">${c.title}</div>
          <div style="font-size:12px;color:#a3e635;margin-top:8px;font-weight:700">🎁 ${c.prize}</div>
        </div>
      </td>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8"><title>Resultado do desafio</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1f2937">

      <tr><td style="background:linear-gradient(135deg,#7c3aed,#22d3ee);padding:28px;text-align:center">
        <div style="font-size:12px;letter-spacing:3px;color:#f0f9ff;font-weight:800">DESAFIO DOS PALPITES</div>
        <div style="font-size:26px;font-weight:900;color:#fff;margin-top:6px">🏆 Resultado do Desafio</div>
        <div style="font-size:14px;color:#f0f9ffcc;margin-top:6px">${match.home_team} ${match.home_score} × ${match.away_score} ${match.away_team}</div>
      </td></tr>

      <tr><td style="padding:24px">
        <div style="font-size:16px;color:#cbd5e1;line-height:1.55">Olá <b style="color:#fff">${user.name}</b>, ${intro}</div>
      </td></tr>

      <tr><td style="padding:0 24px 8px">
        <div style="font-size:12px;letter-spacing:2px;color:#a78bfa;font-weight:800">SEUS ACERTOS</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;background:#0b1220;border:1px solid #1f2937;border-radius:14px;overflow:hidden">
          <tr style="background:#111827"><th align="left" style="padding:10px 12px;font-size:11px;color:#94a3b8;letter-spacing:1.5px">Questão</th><th align="left" style="padding:10px 12px;font-size:11px;color:#94a3b8;letter-spacing:1.5px">Seu palpite</th><th align="left" style="padding:10px 12px;font-size:11px;color:#94a3b8;letter-spacing:1.5px">Correto</th><th align="right" style="padding:10px 12px;font-size:11px;color:#94a3b8;letter-spacing:1.5px">Pts</th></tr>
          ${hitsRows}
          <tr><td colspan="3" style="padding:14px 12px;font-weight:800;color:#fff">Total ganho</td><td style="padding:14px 12px;text-align:right;font-weight:900;color:#fde047;font-size:18px">+${totalPoints} 🪙</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px">
        <div style="font-size:12px;letter-spacing:2px;color:#22d3ee;font-weight:800">SEU PROGRESSO</div>
        <div style="margin-top:8px;font-size:14px;color:#cbd5e1">Faltam <b style="color:#fde047">${remaining.toLocaleString("pt-BR")} 🪙</b> para o próximo prêmio</div>
        <div style="margin-top:10px;height:14px;background:#1f2937;border-radius:999px;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#a78bfa,#22d3ee,#fde047)"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:#94a3b8"><span>${user.tokens.toLocaleString("pt-BR")} 🪙</span><span>${user.nextRewardAt.toLocaleString("pt-BR")} 🪙</span></div>
      </td></tr>

      <tr><td style="padding:0 16px 8px">
        <div style="font-size:12px;letter-spacing:2px;color:#a78bfa;font-weight:800;padding:0 8px">TROQUE SEUS TOKENS</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>${productCards}</tr></table>
      </td></tr>

      <tr><td style="padding:8px 16px">
        <div style="font-size:12px;letter-spacing:2px;color:#fca5a5;font-weight:800;padding:0 8px">⏰ VENCEM EM 24 HORAS</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>${closingCards}</tr></table>
      </td></tr>

      <tr><td style="padding:24px">
        <div style="background:linear-gradient(135deg,#fde04722,#22c55e22);border:1px solid #fde04755;border-radius:16px;padding:20px;text-align:center">
          <div style="font-size:12px;letter-spacing:3px;color:#fde047;font-weight:900">GANHE MAIS TOKENS</div>
          <div style="font-size:18px;color:#fff;font-weight:800;margin-top:8px">Faça missões, convide amigos, crie desafios e dê seu palpite</div>
          <div style="font-size:13px;color:#cbd5e1;margin-top:6px">Quanto mais participar, maior será a chance de ganhar.</div>
          <div style="margin-top:14px"><a href="https://www.desafiodospalpites.com.br/missoes" style="display:inline-block;background:#fde047;color:#0f172a;font-weight:900;padding:12px 22px;border-radius:999px;text-decoration:none">Ver missões →</a></div>
          <div style="margin-top:14px;font-size:14px;color:#e2e8f0">Seu saldo: <b style="color:#fde047">${user.tokens.toLocaleString("pt-BR")} 🪙</b></div>
        </div>
      </td></tr>

      <tr><td style="padding:0 24px 24px">
        <div style="background:#0b1220;border:1px solid #a78bfa55;border-radius:16px;padding:18px">
          <div style="font-size:11px;letter-spacing:3px;color:#22d3ee;font-weight:900">🆕 NOVIDADE</div>
          <div style="margin-top:10px;font-size:15px;color:#fff;font-weight:800">Crie 5 desafios em 24 horas → <span style="color:#fde047">+5.000 🪙</span></div>
          <div style="margin-top:6px;font-size:15px;color:#fff;font-weight:800">Participe de 10 desafios → <span style="color:#fde047">+10.000 🪙</span></div>
        </div>
      </td></tr>

      <tr><td style="background:#020617;padding:18px;text-align:center;font-size:11px;color:#64748b">
        Desafio dos Palpites • <a href="https://www.desafiodospalpites.com.br" style="color:#a78bfa;text-decoration:none">desafiodospalpites.com.br</a>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

export const generateResultEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => data)
  .handler(async ({ data }): Promise<Output> => {
    const key = process.env.LOVABLE_API_KEY;
    const winner =
      data.home_score > data.away_score
        ? data.home_team
        : data.away_score > data.home_score
          ? data.away_team
          : "Empate";

    let intro = `o jogo ${data.home_team} x ${data.away_team} terminou ${data.home_score}-${data.away_score} e já apuramos seus palpites. Confira abaixo seus acertos e o que você ganhou!`;
    let subject = `🏆 Resultado: ${data.home_team} ${data.home_score}x${data.away_score} ${data.away_team} — confira seus acertos`;

    if (key) {
      try {
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const { generateText } = await import("ai");
        const gw = createLovableAiGatewayProvider(key);
        const r = await generateText({
          model: gw("google/gemini-3-flash-preview"),
          prompt: `Escreva em PORTUGUÊS BR, tom animado e curto (máx 2 frases, 280 chars), uma introdução de e-mail para o jogador. Resultado: ${data.home_team} ${data.home_score} x ${data.away_score} ${data.away_team}. Vencedor: ${winner}. Comece direto, sem "Olá". Use 1 emoji. Mencione que vamos mostrar acertos, pontos e prêmios. Apenas o texto, sem aspas.`,
        });
        const txt = (r.text || "").trim().replace(/^["']|["']$/g, "");
        if (txt) intro = txt;
        const r2 = await generateText({
          model: gw("google/gemini-3-flash-preview"),
          prompt: `Escreva um assunto de e-mail curto (máx 70 chars) em PT-BR, animado, com 1 emoji, sobre o resultado: ${data.home_team} ${data.home_score}x${data.away_score} ${data.away_team}. Apenas o assunto, sem aspas.`,
        });
        const s = (r2.text || "").trim().replace(/^["']|["']$/g, "");
        if (s) subject = s;
      } catch {
        /* fall back to defaults */
      }
    }

    // Demo data for the email body (representative jogador)
    const totalPoints = 320;
    const html = buildHtml({
      intro,
      user: { name: "João Silva", tokens: 18450, nextRewardAt: 25000 },
      match: data,
      totalPoints,
      hits: [
        { q: "Vencedor", user: winner, correct: winner, points: 150, ok: true },
        { q: "Placar exato", user: `${data.home_score}-${data.away_score}`, correct: `${data.home_score}-${data.away_score}`, points: 120, ok: true },
        { q: "Primeiro a marcar", user: data.home_team, correct: data.away_team, points: 0, ok: false },
        { q: "Total de gols", user: String(data.home_score + data.away_score), correct: String(data.home_score + data.away_score), points: 50, ok: true },
      ],
      closingSoon: [
        { title: "Quem ganha a próxima eliminatória?", closesIn: "em 6h", prize: "10.000 🪙" },
        { title: "Artilheiro da rodada", closesIn: "em 14h", prize: "Camisa Oficial" },
        { title: "Placar do clássico", closesIn: "em 22h", prize: "5.000 🪙" },
      ],
    });

    return { subject, intro, html };
  });
