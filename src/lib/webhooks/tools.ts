/**
 * Webhook Tools Implementation
 * Provides functionality to create AI tools from webhooks
 */

import { getDb } from "../db/db-connection";
import {
  newWebhookSchema,
  webhooks,
  WebhookSelect,
} from "../db/schema/webhooks";
import { and, eq, or } from "drizzle-orm";
import { WebhookTriggerError, WebhookTriggerOptions } from "./trigger";
import * as v from "valibot";
import { type Tool } from "ai";
import { jsonSchema } from "ai";
import log from "../log";
import type { ToolContext, ToolReturn } from "../ai/ai-sdk/types";
import { addBaseTool } from "../ai/interaction/tools";

// Define parameter type options
const parameterTypeSchema = v.union([
  v.literal("string"),
  v.literal("number"),
  v.literal("integer"),
  v.literal("boolean"),
  v.literal("array"),
  v.literal("object"),
  v.literal("null"),
  v.literal("date"),
  v.literal("regexp"),
  v.literal("function"),
  v.literal("undefined"),
]);

// Define parameter schema
const parameterSchema = v.object({
  name: v.string(),
  type: parameterTypeSchema,
  required: v.boolean(),
});

// Define meta schema for tool webhooks
const toolMetaSchema = v.object({
  name: v.string(),
  description: v.string(),
  parameters: v.array(parameterSchema),
});

export type ToolMeta = v.InferOutput<typeof toolMetaSchema>;

export type WebhookTool = WebhookSelect & { meta: ToolMeta };

export const toolValidationSchema = v.intersect([
  newWebhookSchema,
  v.object({
    meta: toolMetaSchema,
  }),
]);

/**
 * Get a tool from a webhook with the provided context
 */
export const getToolFactoryFromWebhookByName = (
  webhookName: string,
  context: ToolContext
): Promise<ToolReturn> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get webhook details
      const webhook = (await getDb().query.webhooks.findFirst({
        where: and(
          eq(webhooks.name, webhookName),
          eq(webhooks.organisationId, context.organisationId),
          eq(webhooks.event, "tool"),
          eq(webhooks.type, "n8n"),
          or(
            eq(webhooks.organisationWide, true),
            eq(webhooks.userId, context.userId)
          )
        ),
      })) as WebhookSelect & { meta: ToolMeta };

      if (!webhook) {
        reject(new Error(`Tool webhook with name ${webhookName} not found`));
        return;
      }

      // Validate webhook with tool schema to ensure it has proper meta information
      try {
        v.parse(toolValidationSchema, webhook);
      } catch (validationError) {
        reject(new Error(`Invalid tool webhook: ${validationError}`));
        return;
      }

      // Create unique tool name
      const toolName = `webhooktool-${webhook.name}`;

      // Create the tool
      const webhookTool: Tool = {
        description: webhook.meta.description,
        parameters: jsonSchema({
          type: "object",
          properties: webhook.meta.parameters.reduce(
            (props: Record<string, any>, param) => {
              props[param.name] = {
                type: param.type,
                description: param.name,
                //required: param.required,
              };
              return props;
            },
            {}
          ),
          required: webhook.meta.parameters
            .filter((param) => param.required)
            .map((param) => param.name),
        }),
        execute: async (params: any) => {
          log.info(`TOOL-CALL: executing webhook tool ${toolName}`, params);

          try {
            const result = await triggerToolWebhook(
              webhook.id,
              context,
              params
            );

            log.info(`Webhook tool executed successfully: ${webhook.id}`);

            return result.response;
          } catch (error: any) {
            throw new Error(`Error executing webhook tool: ${error.message}`);
          }
        },
      };

      resolve({
        name: toolName,
        tool: webhookTool,
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get all tool webhooks for an organisation
 */
export const getWebhookToolsForOrganisation = async (
  organisationId: string
): Promise<WebhookTool[]> => {
  const entries = (await getDb().query.webhooks.findMany({
    where: and(
      eq(webhooks.organisationId, organisationId),
      eq(webhooks.event, "tool"),
      eq(webhooks.organisationWide, true)
    ),
  })) as WebhookTool[];

  return entries;
};

/**
 * Get all tool webhooks for an userId
 */
export const getWebhookToolsForUser = async (
  userId: string,
  organisationId: string
): Promise<WebhookTool[]> => {
  const entries = (await getDb().query.webhooks.findMany({
    where: and(
      eq(webhooks.organisationId, organisationId),
      eq(webhooks.event, "tool"),
      eq(webhooks.organisationWide, false),
      eq(webhooks.userId, userId)
    ),
  })) as WebhookTool[];

  return entries;
};

/**
 * Trigger a tool webhook by its ID
 * This will not check again the access rights of the user
 */
export const triggerToolWebhook = async (
  webhookId: string,
  context: ToolContext,
  payload: any
) => {
  // Get webhook details
  const webhook = await getDb().query.webhooks.findFirst({
    where: and(eq(webhooks.id, webhookId)),
  });

  if (!webhook) {
    throw new WebhookTriggerError("Webhook not found", 404);
  }

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    ...(webhook.headers || {}),
  };

  try {
    // Make the request
    const response = await fetch(webhook.webhookUrl, {
      method: webhook.method,
      headers,
      body:
        webhook.method !== "GET" ? JSON.stringify(payload || {}) : undefined,
    });

    if (!response.ok) {
      throw new WebhookTriggerError(
        `Webhook request failed with status ${response.status}`,
        response.status
      );
    }

    try {
      const json = await response.json();
      return {
        success: true,
        statusCode: response.status,
        response: json,
      };
    } catch (error) {
      return {
        success: true,
        statusCode: response.status,
        response: await response.text(),
      };
    }
  } catch (error) {
    if (error instanceof WebhookTriggerError) {
      throw error;
    }
    throw new WebhookTriggerError(
      `Failed to trigger webhook: ${error + ""}`,
      500
    );
  }
};
