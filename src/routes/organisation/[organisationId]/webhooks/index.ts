import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import { authAndSetUsersInfo } from "../../../../lib/utils/hono-middlewares";
import {
  createWebhook,
  deleteWebhook,
  getAllOrganisationWebhooks,
  getAllUsersWebhooks,
  getWebhookById,
  updateWebhook,
} from "../../../../lib/webhooks/crud";
import {
  newWebhookSchema,
  updateWebhookSchema,
  webhookSchema,
} from "../../../../lib/db/schema/webhooks";
import * as v from "valibot";
import {
  triggerWebhook,
  WebhookTriggerError,
} from "../../../../lib/webhooks/trigger";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { RESPONSES } from "../../../../lib/responses";

export default function defineWebhookRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new webhook
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/webhooks",
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/webhooks",
      tags: ["webhooks"],
      summary: "Create a new webhook",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(webhookSchema),
            },
          },
        },
      },
    }),
    validator("json", newWebhookSchema),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const parsed = c.req.valid("json");
        const { organisationId } = c.req.valid("param");

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

  /**
   * Get all webhooks for the user
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/webhooks",
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/webhooks",
      tags: ["webhooks"],
      summary: "Get all webhooks for the user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(webhookSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { organisationId } = c.req.valid("param");
        const webhooks = await getAllUsersWebhooks(userId, organisationId);
        return c.json(webhooks);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting webhooks: " + err,
        });
      }
    }
  );

  /**
   * Get all webhooks for the organisation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/global",
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/webhooks/global",
      tags: ["webhooks"],
      summary: "Get all organisation webhooks",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(webhookSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { organisationId } = c.req.valid("param");
        const webhooks = await getAllOrganisationWebhooks(organisationId);
        return c.json(webhooks);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting webhooks: " + err,
        });
      }
    }
  );

  /**
   * Get a specific webhook by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/:id",
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/webhooks/:id",
      tags: ["webhooks"],
      summary: "Get a specific webhook by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(webhookSchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { id } = c.req.valid("param");
        const webhook = await getWebhookById(id, userId);
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

  /**
   * Update a webhook
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/:id",
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/webhooks/:id",
      tags: ["webhooks"],
      summary: "Update a webhook",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(webhookSchema),
            },
          },
        },
      },
    }),
    validator("json", updateWebhookSchema),
    validator(
      "param",
      v.object({ id: v.string(), organisationId: v.string() })
    ),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { id } = c.req.valid("param");
        const parsed = c.req.valid("json");
        const webhook = await updateWebhook(id, parsed, userId);
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

  /**
   * Delete a webhook
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/:id",
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/webhooks/:id",
      tags: ["webhooks"],
      summary: "Delete a webhook",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ id: v.string(), organisationId: v.string() })
    ),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { id } = c.req.valid("param");
        await deleteWebhook(id, userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting webhook: " + err,
        });
      }
    }
  );

  /**
   * Register webhook (specifically for n8n integration)
   */

  app.post(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/register/n8n",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/webhooks/register/n8n",
      tags: ["webhooks"],
      summary: "Register a webhook for n8n",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({ id: v.string(), success: v.boolean() })
              ),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        name: v.string(),
        webhookUrl: v.string(),
        event: v.string(),
        organisationId: v.string(),
        organisationWide: v.optional(v.boolean()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");

        // check event type
        if (body.event !== "chatOutput") {
          throw new HTTPException(400, {
            message: "Event must be chatOutput",
          });
        }
        const parsed = v.parse(newWebhookSchema, {
          userId: userId,
          organisationId,
          name: body.name,
          type: "n8n",
          event: "chat-output",
          webhookUrl: body.webhookUrl,
          organisationWide: body.organisationWide ?? false,
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

  /**
   * Add webhook check endpoint
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/check",
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/webhooks/check",
      tags: ["webhooks"],
      summary: "Check if a webhook exists",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  exists: v.boolean(),
                })
              ),
            },
          },
        },
      },
    }),
    validator("json", v.object({ webhookId: v.string() })),
    validator("param", v.object({ organisationId: v.string() })),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { webhookId } = c.req.valid("json");

        const webhook = await getWebhookById(webhookId, userId);
        return c.json({
          exists: !!webhook,
        });
      } catch (err) {
        return c.json({ exists: false });
      }
    }
  );

  /**
   * Trigger a webhook
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/webhooks/:id/trigger",
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/webhooks/:id/trigger",
      tags: ["webhooks"],
      summary: "Trigger a webhook",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", v.any()),
    validator(
      "param",
      v.object({ id: v.string(), organisationId: v.string() })
    ),
    authAndSetUsersInfo,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { id, organisationId } = c.req.valid("param");
        const body = c.req.valid("json");

        const result = await triggerWebhook(id, organisationId, {
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
