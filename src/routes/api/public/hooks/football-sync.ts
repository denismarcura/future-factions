import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/football-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json().catch(() => ({}))) as {
          mode?: "daily" | "today" | "live" | "recheck";
        };
        const mode = body.mode ?? "today";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { syncCompetitionMatches } = await import("@/lib/football-sync.server");

        const { data: comps } = await supabaseAdmin
          .from("football_competitions")
          .select("code, season, auto_create_challenges, auto_update_results, active, sync_frequency")
          .eq("active", true);

        const today = new Date();
        const iso = (d: Date) => d.toISOString().slice(0, 10);

        let dateFrom: string | undefined;
        let dateTo: string | undefined;
        let status: string | undefined;

        switch (mode) {
          case "daily":
            dateFrom = iso(today);
            dateTo = iso(new Date(today.getTime() + 14 * 86400_000));
            break;
          case "today":
            dateFrom = iso(today);
            dateTo = iso(today);
            status = "SCHEDULED,TIMED";
            break;
          case "live":
            status = "IN_PLAY,PAUSED,LIVE";
            break;
          case "recheck":
            dateFrom = iso(new Date(today.getTime() - 86400_000));
            dateTo = iso(today);
            status = "FINISHED";
            break;
        }

        const results: any[] = [];
        for (const c of comps ?? []) {
          try {
            const r = await syncCompetitionMatches(c.code, {
              season: c.season ?? undefined,
              dateFrom,
              dateTo,
              status,
              autoCreateChallenges: c.auto_create_challenges,
              autoUpdateResults: c.auto_update_results,
            });
            results.push({ code: c.code, ...r });
          } catch (e) {
            results.push({ code: c.code, ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        return Response.json({ ok: true, mode, count: results.length, results });
      },
    },
  },
});
