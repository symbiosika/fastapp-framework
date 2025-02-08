/**
 * Routes to manage the prompt templates for each organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import {
  addPromptTemplate,
  addPromptTemplatePlaceholder,
  deletePromptTemplate,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  getPlainTemplate,
  getTemplates,
  updatePromptTemplate,
  updatePromptTemplatePlaceholder,
} from "../../../../lib/ai/prompt-templates/crud";
import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import { parseCommaSeparatedListFromUrlParam } from "../../../../lib/url";
import { RESPONSES } from "../../../../lib/responses";
import {
  getPromptSnippets,
  getPromptSnippetById,
  addPromptSnippet,
  updatePromptSnippet,
  deletePromptSnippet,
} from "../../../../lib/ai/prompt-snippets";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import * as v from "valibot";
import {
  promptTemplatePlaceholdersInsertSchema,
  promptTemplatesInsertSchema,
} from "../../../../dbSchema";

const updatePromptTemplatePlaceholderSchema = v.intersect([
  promptTemplatesInsertSchema,
  v.object({
    id: v.string(),
  }),
]);

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**

   * Get a plain template
   * URL params:
   * - promptId: string (optional)
   * - promptName: string (optional)
   * - promptCategory: string (optional)
   * - organisationId: string
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/:id?",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const promptId = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        const promptName = c.req.query("promptName");
        const promptCategory = c.req.query("promptCategory");

        if (!organisationId) {
          throw new HTTPException(400, {
            message: 'Parameter "organisationId" is required',
          });
        }

        if (!promptId && !promptName && !promptCategory) {
          const r = await getTemplates(organisationId);
          return c.json(r);
        }
        const r = await getPlainTemplate({
          promptId,
          promptName,
          promptCategory,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a new prompt template
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const organisationId = c.req.param("organisationId");
        const validatedBody = v.parse(promptTemplatesInsertSchema, body);

        if (organisationId !== validatedBody.organisationId) {
          throw new HTTPException(400, {
            message:
              'Parameter "organisationId" does not match body.organisationId',
          });
        }

        const r = await addPromptTemplate({ ...validatedBody, organisationId });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a prompt template by ID
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        const body = await c.req.json();
        const validatedBody = v.parse(
          updatePromptTemplatePlaceholderSchema,
          body
        );

        if (organisationId !== validatedBody.organisationId) {
          throw new HTTPException(400, {
            message:
              'Parameter "organisationId" does not match body.organisationId',
          });
        }

        const r = await updatePromptTemplate(validatedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a prompt template by ID
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        if (!organisationId) {
          throw new HTTPException(400, {
            message: 'Parameter "organisationId" is required',
          });
        }
        const r = await deletePromptTemplate(id, organisationId);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get all placeholders for a prompt template by ID
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("promptTemplateId");
        const r = await getPlainPlaceholdersForPromptTemplate(id);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a new placeholder to a prompt template
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const promptTemplateId = c.req.param("promptTemplateId");
        const body = await c.req.json();
        const validatedBody = v.parse(
          promptTemplatePlaceholdersInsertSchema,
          body
        );
        const r = await addPromptTemplatePlaceholder({
          ...validatedBody,
          promptTemplateId,
        });

        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a prompt-template placeholder by ID
   */
  app.put(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const promptTemplateId = c.req.param("promptTemplateId");
        const id = c.req.param("id");
        const body = await c.req.json();
        const r = await updatePromptTemplatePlaceholder({
          ...body,
          id,
          promptTemplateId: promptTemplateId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a placeholder for a prompt template by ID
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const promptTemplateId = c.req.param("promptTemplateId");
        const id = c.req.param("id");
        const r = await deletePromptTemplatePlaceholder(id, promptTemplateId);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get an object with all placeholders for a prompt template with the default values
   * URL params:
   * - promptId: string
   * - promptName: string
   * - promptCategory: string
   * - organisationId: string
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/placeholders",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const promptId = c.req.query("promptId");
        const promptName = c.req.query("promptName");
        const promptCategory = c.req.query("promptCategory");
        const organisationId = c.req.query("organisationId");
        const r = await getPlaceholdersForPromptTemplate({
          promptId,
          promptName,
          promptCategory,
          organisationId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get prompt snippets
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets/:id?",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const organisationId = c.req.param("organisationId");
        const id = c.req.param("id");
        const names = parseCommaSeparatedListFromUrlParam(
          c.req.query("name"),
          []
        );
        const categories = parseCommaSeparatedListFromUrlParam(
          c.req.query("category"),
          []
        );

        if (id) {
          const snippet = await getPromptSnippetById(id, organisationId);
          return c.json(snippet);
        }

        const snippets = await getPromptSnippets({
          names,
          categories,
          organisationId,
        });
        return c.json(snippets);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a new prompt snippet
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        const snippet = await addPromptSnippet({
          ...body,
          userId: usersId,
          organisationId,
        });
        return c.json(snippet);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a prompt snippet
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        const body = await c.req.json();
        const snippet = await updatePromptSnippet(id, organisationId, {
          ...body,
        });
        return c.json(snippet);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a prompt snippet
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        await deletePromptSnippet(id, organisationId);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
