import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { authAndSetUsersInfo } from "../../lib/utils/hono-middlewares";
import {
  createWebhook,
  deleteWebhook,
  getAllUsersWebhooks,
  getWebhookById,
  updateWebhook,
} from "../../lib/webhooks/crud";
import { newWebhookSchema, webhookSchema } from "../../lib/db/schema/webhooks";
import * as v from "valibot";
import {
  triggerWebhook,
  WebhookTriggerError,
} from "../../lib/webhooks/trigger";

export default function defineWebhookRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  // Create a new webhook
  app.post(
    API_BASE_PATH + "/webhooks",

    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const organisationId = c.get("organisationId");
        const body = await c.req.json();
        const parsed = v.parse(newWebhookSchema, body);

        const webhook = await createWebhook(userId, {
          ...parsed,
          organisationId,
        });

        return c.json(webhook);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating webhook: " + err,
        });
      }
    }
  );

  // Get all webhooks for the user
  app.get(
    API_BASE_PATH + "/webhooks",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const organisationId = c.req.query("organisationId");

        if (!organisationId) {
          throw new HTTPException(400, {
            message: "Organisation ID is required",
          });
        }

        const webhooks = await getAllUsersWebhooks(userId, organisationId);
        return c.json(webhooks);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting webhooks: " + err,
        });
      }
    }
  );

  // Get a specific webhook by ID
  app.get(
    API_BASE_PATH + "/webhooks/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const webhookId = c.req.param("id");
        const webhook = await getWebhookById(webhookId, userId);

        if (!webhook) {
          throw new HTTPException(404, { message: "Webhook not found" });
        }

        return c.json(webhook);
      } catch (err) {
        if (err instanceof HTTPException) throw err;
        throw new HTTPException(500, {
          message: "Error getting webhook: " + err,
        });
      }
    }
  );

  // Update a webhook
  app.put(
    API_BASE_PATH + "/webhooks/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const webhookId = c.req.param("id");
        const body = await c.req.json();
        const parsed = v.parse(webhookSchema, body);
        const webhook = await updateWebhook(webhookId, parsed, userId);
        if (!webhook) {
          throw new HTTPException(404, { message: "Webhook not found" });
        }
        return c.json(webhook);
      } catch (err) {
        if (err instanceof HTTPException) throw err;
        throw new HTTPException(500, {
          message: "Error updating webhook: " + err,
        });
      }
    }
  );

  // Delete a webhook
  app.delete(
    API_BASE_PATH + "/webhooks/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const webhookId = c.req.param("id");

        await deleteWebhook(webhookId, userId);
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting webhook: " + err,
        });
      }
    }
  );

  // Register webhook (specifically for n8n integration)
  app.post(
    API_BASE_PATH + "/webhooks/register/n8n",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const body = await c.req.json();

        if (!body.name || !body.webhookUrl || !body.event) {
          throw new HTTPException(400, {
            message: "Name, webhookUrl and event are required",
          });
        }

        // check event type
        if (body.event !== "chatOutput") {
          throw new HTTPException(400, {
            message: "Event must be chatOutput",
          });
        }
        const parsed = v.parse(newWebhookSchema, {
          userId: userId,
          organisationId: body.organisationId,
          name: body.name,
          type: "n8n",
          event: "chat-output",
          webhookUrl: body.webhookUrl,
        });
        const webhook = await createWebhook(userId, parsed);

        // Return format compatible with n8n expectations
        return c.json({
          id: webhook.id,
          success: true,
        });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error registering webhook: " + err,
        });
      }
    }
  );

  // Add webhook check endpoint
  app.post(
    API_BASE_PATH + "/webhooks/check",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const body = await c.req.json();
        const webhookId = body.webhookId;

        if (!webhookId) {
          return c.json({ exists: false });
        }

        const webhook = await getWebhookById(webhookId, userId);
        return c.json({
          exists: !!webhook,
        });
      } catch (err) {
        return c.json({ exists: false });
      }
    }
  );

  // Trigger a webhook
  app.post(
    API_BASE_PATH + "/webhooks/:id/trigger",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const webhookId = c.req.param("id");
        const organisationId = c.req.query("organisationId");
        const body = await c.req.json().catch(() => ({}));

        if (!organisationId) {
          throw new HTTPException(400, {
            message: "Organisation ID is required",
          });
        }

        const result = await triggerWebhook(webhookId, organisationId, {
          payload: body,
        });

        return c.json(result);
      } catch (err: any) {
        if (err instanceof WebhookTriggerError) {
          throw new HTTPException(500, {
            message: err.message,
          });
        }
        throw new HTTPException(500, {
          message: "Error triggering webhook: " + err,
        });
      }
    }
  );
}
