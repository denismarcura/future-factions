import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest } from "@lovable.dev/webhooks-js";
import { recordResendWebhook } from "@/lib/email-marketing.functions";

export const Route = createFileRoute("/api/resend/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const secret = process.env.LOVABLE_API_KEY;
          let payload: unknown;

          if (secret) {
            const verified = await verifyWebhookRequest({ req: request, secret });
            payload = verified.payload;
          } else {
            payload = await request.json();
          }

          await recordResendWebhook(payload);
          return Response.json({ ok: true });
        } catch (error) {
          console.error("Resend webhook failed", error);
          return Response.json({ ok: false }, { status: 400 });
        }
      },
    },
  },
});
