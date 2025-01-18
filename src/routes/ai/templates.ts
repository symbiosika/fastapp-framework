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
} from "../../lib/ai/generation/crud";
import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import { parseCommaSeparatedListFromUrlParam } from "../../lib/url";
import { RESPONSES } from "../../lib/responses";
import {
  getPromptSnippets,
  getPromptSnippetById,
  addPromptSnippet,
  updatePromptSnippet,
  deletePromptSnippet,
} from "../../lib/ai/prompt-snippets";

export default function defineRoutes(app: FastAppHono) {
  /**
   * Get a plain template
   * URL params:
   * - promptId: string (optional)
   * - promptName: string (optional)
   * - promptCategory: string (optional)
   * - organisationId: string
   */
  app.get("/templates/organisation/:organisationId/:id?", async (c) => {
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
  });

  /**
   * Add a new prompt template
   */
  app.post("/templates/organisation/:organisationId", async (c) => {
    try {
      const body = await c.req.json();
      const organisationId = c.req.param("organisationId");

      if (organisationId !== body.organisationId) {
        throw new HTTPException(400, {
          message:
            'Parameter "organisationId" does not match body.organisationId',
        });
      }

      const r = await addPromptTemplate({ ...body, organisationId });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update a prompt template by ID
   */
  app.put("/templates/organisation/:organisationId/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const organisationId = c.req.param("organisationId");
      const body = await c.req.json();

      if (organisationId !== body.organisationId) {
        throw new HTTPException(400, {
          message:
            'Parameter "organisationId" does not match body.organisationId',
        });
      }

      const r = await updatePromptTemplate({ ...body, id, organisationId });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete a prompt template by ID
   */
  app.delete("/templates/organisation/:organisationId/:id", async (c) => {
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
  });

  /**
   * Get all placeholders for a prompt template by ID
   */
  app.get("/templates/:promptTemplateId/placeholders", async (c) => {
    try {
      const id = c.req.param("promptTemplateId");
      const r = await getPlainPlaceholdersForPromptTemplate(id);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Add a new placeholder to a prompt template
   */
  app.post("/templates/:promptTemplateId/placeholders", async (c) => {
    try {
      const promptTemplateId = c.req.param("promptTemplateId");
      const body = await c.req.json();
      const r = await addPromptTemplatePlaceholder({
        ...body,
        promptTemplateId,
      });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update a prompt-template placeholder by ID
   */
  app.put("/templates/:promptTemplateId/placeholders/:id", async (c) => {
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
  });

  /**
   * Delete a placeholder for a prompt template by ID
   */
  app.delete("/templates/:promptTemplateId/placeholders/:id", async (c) => {
    try {
      const promptTemplateId = c.req.param("promptTemplateId");
      const id = c.req.param("id");
      const r = await deletePromptTemplatePlaceholder(id, promptTemplateId);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Get an object with all placeholders for a prompt template with the default values
   * URL params:
   * - promptId: string
   * - promptName: string
   * - promptCategory: string
   * - organisationId: string
   */
  app.get("/templates/placeholders", async (c) => {
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
  });

  /**
   * Get prompt snippets
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get("/prompt-snippets/organisation/:organisationId/:id?", async (c) => {
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
  });

  /**
   * Add a new prompt snippet
   */
  app.post("/prompt-snippets/organisation/:organisationId", async (c) => {
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
  });

  /**
   * Update a prompt snippet
   */
  app.put("/prompt-snippets/organisation/:organisationId/:id", async (c) => {
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
  });

  /**
   * Delete a prompt snippet
   */
  app.delete("/prompt-snippets/organisation/:organisationId/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const organisationId = c.req.param("organisationId");
      await deletePromptSnippet(id, organisationId);
      return c.json(RESPONSES.SUCCESS);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });
}
