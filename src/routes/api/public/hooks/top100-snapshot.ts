import { createFileRoute } from "@tanstack/react-router";
import { pointsForParticipants } from "@/lib/top100.functions";

export const Route = createFileRoute("/api/public/hooks/top100-snapshot")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Snapshot of the previous calendar month.
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
        const monthStart = new Date(target.getFullYear(), target.getMonth(), 1).toISOString();
        const monthEnd = new Date(target.getFullYear(), target.getMonth() + 1, 1).toISOString();

        // Aggregate by creator using corporate_challenges + challenges metadata (best-effort).
        // We use challenges as the source of truth.
        const { data: chs, error } = await supabaseAdmin
          .from("challenges")
          .select("id, owner_id, created_at")
          .gte("created_at", monthStart)
          .lt("created_at", monthEnd);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const byUser = new Map<string, { count: number; participants: number; points: number }>();
        for (const c of (chs ?? []) as Array<{ id: string; owner_id: string | null }>) {
          if (!c.owner_id) continue;
          const { count } = await supabaseAdmin
            .from("palpites")
            .select("user_id", { count: "exact", head: true })
            .eq("challenge_id", c.id);
          const participants = count ?? 0;
          const pts = pointsForParticipants(participants);
          const cur = byUser.get(c.owner_id) ?? { count: 0, participants: 0, points: 0 };
          cur.count += 1;
          cur.participants += participants;
          cur.points += pts;
          byUser.set(c.owner_id, cur);
        }

        const ranked = [...byUser.entries()]
          .map(([user_id, v]) => ({ user_id, ...v }))
          .sort((a, b) => b.points - a.points || b.participants - a.participants)
          .slice(0, 100)
          .map((r, i) => ({
            month_key: monthKey,
            user_id: r.user_id,
            challenges_count: r.count,
            total_participants: r.participants,
            points: r.points,
            rank: i + 1,
          }));

        if (ranked.length) {
          await supabaseAdmin.from("top100_snapshots" as never).delete().eq("month_key", monthKey);
          const { error: insErr } = await supabaseAdmin.from("top100_snapshots" as never).insert(ranked as never);
          if (insErr) return Response.json({ error: insErr.message }, { status: 500 });
        }

        return Response.json({ ok: true, monthKey, count: ranked.length });
      },
    },
  },
});
