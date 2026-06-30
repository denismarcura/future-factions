import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Grava um débito de participação em token_transactions (idempotente).
 * Usa supabaseAdmin para bypassar RLS (authenticated só tem SELECT na tabela).
 * O índice único idx_token_tx_participation_unique garante no máximo um
 * débito por (user_id, challenge_id) com reason = 'participation'.
 */
export const recordParticipationDebit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { challengeId: string; entryFee: number }) => input)
  .handler(async ({ data, context }) => {
    if (!data.challengeId || data.entryFee <= 0) return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("token_transactions")
      .insert({
        user_id: context.userId,
        challenge_id: data.challengeId,
        delta: -data.entryFee,
        reason: "participation",
      });
    // Conflito de unique index = já registrado → ignora
    if (error && !error.message.includes("unique")) throw error;
    return { ok: true };
  });
