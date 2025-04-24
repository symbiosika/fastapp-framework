import { describeRoute } from "hono-openapi";
import type { FastAppHono } from "../../../types";
import log from "../../../lib/log";
import { validator } from "hono-openapi/valibot";
import * as v from "valibot";
import { whatsappBusinessCloud } from "../../../lib/communication/whatsapp";

export default function defineWhatsAppRoutes(
  app: FastAppHono,
  basePath: string
) {
  // Webhook verification endpoint
  app.get(
    basePath + "/communication/wa/webhook",
    describeRoute({
      method: "get",
      path: basePath + "/communication/wa/webhook",
      tags: ["communication", "whatsapp"],
      summary: "Verify WhatsApp webhook",
      parameters: [
        {
          name: "hub.mode",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "hub.verify_token",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "hub.challenge",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Webhook verification successful",
          content: {
            "text/plain": {
              schema: { type: "string" },
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        "hub.mode": v.string(),
        "hub.verify_token": v.string(),
        "hub.challenge": v.string(),
      })
    ),
    async (c) => {
      /**
       * Simple challenge response for whatsapp webhook verification
       */
      const {
        "hub.mode": mode,
        "hub.verify_token": token,
        "hub.challenge": challenge,
      } = c.req.valid("query");
      log.info("WhatsApp register webhook received", {
        mode,
        token,
        challenge,
      });
      if (
        mode === "subscribe" &&
        token === process.env.WEBHOOK_VERIFICATION_TOKEN
      ) {
        return c.text(challenge);
      } else {
        return c.text("Invalid verification token", 403);
      }
    }
  );

  // Webhook endpoint for receiving messages
  app.post(
    basePath + "/communication/wa/webhook",
    describeRoute({
      method: "post",
      path: basePath + "/communication/wa/webhook",
      tags: ["communication", "whatsapp"],
      summary: "Receive WhatsApp Events",
      responses: {
        200: {
          description: "Message received successfully",
        },
      },
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        log.info("Received body:", { body });

        const t = await whatsappBusinessCloud.processWebhook(body);
        log.info("t", t);

        return c.text("OK");
      } catch (error) {
        if (error instanceof Error) {
          log.error("Error processing WhatsApp webhook", error.message);
        }
        return c.text("Internal Server Error", 500);
      }
    }
  );
}
