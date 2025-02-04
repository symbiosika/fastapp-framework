/**
 * Routes to manage the knowledge entries for each organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { extractKnowledgeFromExistingDbEntry } from "../../../../lib/ai/knowledge/add-knowledge";
import { parseDocument } from "../../../../lib/ai/parsing";
import {
  deleteKnowledgeEntry,
  getFullSourceDocumentsForKnowledgeEntry,
  getKnowledgeEntries,
} from "../../../../lib/ai/knowledge/get-knowledge";
import { RESPONSES } from "../../../../lib/responses";
import {
  getFullSourceDocumentsForSimilaritySearch,
  getNearestEmbeddings,
} from "../../../../lib/ai/knowledge/similarity-search";
import log from "../../../../lib/log";
import {
  createKnowledgeText,
  readKnowledgeText,
  updateKnowledgeText,
  deleteKnowledgeText,
} from "../../../../lib/ai/knowledge/knowledge-texts";
import { addKnowledgeTextFromUrl } from "../../../../lib/ai/knowledge-texts";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import { validateOrganisationId } from "../../../../lib/utils/doublecheck-organisation";

const FileSourceType = {
  DB: "db",
  LOCAL: "local",
  URL: "url",
  TEXT: "text",
} as const;

const generateKnowledgeValidation = v.object({
  organisationId: v.string(),
  sourceType: v.enum(FileSourceType),
  sourceId: v.optional(v.string()),
  sourceFileBucket: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  filters: v.optional(v.record(v.string(), v.string())),
  teamId: v.optional(v.string()),
  userId: v.optional(v.string()),
  workspaceId: v.optional(v.string()),
});
export type GenerateKnowledgeInput = v.InferOutput<
  typeof generateKnowledgeValidation
>;

const askKnowledgeValidation = v.object({
  question: v.string(),
  countChunks: v.optional(v.number()),
  addBeforeN: v.optional(v.number()),
  addAfterN: v.optional(v.number()),
  filterKnowledgeEntryIds: v.optional(v.array(v.string())),
});
export type AskKnowledgeInput = v.InferOutput<typeof askKnowledgeValidation>;

const parseDocumentValidation = v.object({
  sourceType: v.enum(FileSourceType),
  sourceId: v.optional(v.string()),
  sourceFileBucket: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  organisationId: v.string(),
});
export type ParseDocumentInput = v.InferOutput<typeof parseDocumentValidation>;

const similaritySearchValidation = v.object({
  organisationId: v.string(),
  searchText: v.string(),
  n: v.optional(v.number()),
  addBeforeN: v.optional(v.number()),
  addAfterN: v.optional(v.number()),
  filterKnowledgeEntryIds: v.optional(v.array(v.string())),
  filter: v.optional(v.record(v.string(), v.array(v.string()))),
  filterName: v.optional(v.array(v.string())),
  fullDocument: v.optional(v.boolean()),
});
type SimilaritySearchInput = v.InferOutput<typeof similaritySearchValidation>;

const addFromTextValidation = v.object({
  organisationId: v.string(),
  text: v.string(),
});
type AddFromTextInput = v.InferOutput<typeof addFromTextValidation>;

const addFromUrlValidation = v.object({
  organisationId: v.string(),
  url: v.string(),
});
type AddFromUrlInput = v.InferOutput<typeof addFromUrlValidation>;

const createKnowledgeTextValidation = v.object({
  organisationId: v.string(),
  text: v.string(),
  title: v.optional(v.string()),
  meta: v.optional(
    v.record(
      v.string(),
      v.union([v.string(), v.number(), v.boolean(), v.undefined()])
    )
  ),
});
type CreateKnowledgeTextInput = v.InferOutput<
  typeof createKnowledgeTextValidation
>;

const updateKnowledgeTextValidation = v.object({
  organisationId: v.string(),
  text: v.optional(v.string()),
  title: v.optional(v.string()),
  meta: v.optional(
    v.record(
      v.string(),
      v.union([v.string(), v.number(), v.boolean(), v.undefined()])
    )
  ),
});
type UpdateKnowledgeTextInput = v.InferOutput<
  typeof updateKnowledgeTextValidation
>;

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Call the knowledge extraction from a document to generate embeddings in the database
   * A document can be a plain text in the DB, a markdown file, an PDF file, an image, etc.
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/knowledge/extract-knowledge",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = v.parse(generateKnowledgeValidation, body);
        validateOrganisationId(parsedBody, c.req.param("organisationId"));

        const r = await extractKnowledgeFromExistingDbEntry(parsedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Get all knowledge entries
   * URL params:
   * - limit: number
   * - page: number
   * - teamId: string
   * - userId: string
   */

  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/entries",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const organisationId = c.req.param("organisationId");
        const usersId = c.get("usersId");
        // Url params
        const limitStr = c.req.query("limit");
        const pageStr = c.req.query("page");
        const teamId = c.req.query("teamId");
        const workspaceId = c.req.query("workspaceId");
        const limit = parseInt(limitStr ?? "100");
        const page = parseInt(pageStr ?? "0");

        const r = await getKnowledgeEntries({
          limit,
          page,
          organisationId,
          userId: usersId,
          teamId,
          workspaceId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get a full source document for a knowledge entry by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/entries/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        const usersId = c.get("usersId");
        const r = await getFullSourceDocumentsForKnowledgeEntry(
          id,
          organisationId,
          usersId
        );

        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a knowledge entry by ID
   * URL params:
   * - organisationId: string
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/entries/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        const usersId = c.get("usersId");
        await deleteKnowledgeEntry(id, organisationId, usersId);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Search for similar documents (POST)
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/knowledge/similarity-search",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const body = await c.req.json();
        const parsedBody = v.parse(similaritySearchValidation, body);
        validateOrganisationId(parsedBody, c.req.param("organisationId"));

        if (parsedBody.fullDocument) {
          const r = await getFullSourceDocumentsForSimilaritySearch({
            organisationId: parsedBody.organisationId,
            searchText: parsedBody.searchText,
            n: parsedBody.n,
            filterKnowledgeEntryIds: parsedBody.filterKnowledgeEntryIds,
            filter: parsedBody.filter,
            filterName: parsedBody.filterName,
            userId,
          });
          return c.json(r);
        }
        const query = {
          organisationId: parsedBody.organisationId,
          searchText: parsedBody.searchText,
          n: parsedBody.n,
          addBeforeN: parsedBody.addBeforeN,
          addAfterN: parsedBody.addAfterN,
          filterKnowledgeEntryIds: parsedBody.filterKnowledgeEntryIds,
          filter: parsedBody.filter,
          filterName: parsedBody.filterName,
        };
        // log.debug(`POST /knowledge/similarity-search`, query);

        const r = await getNearestEmbeddings(query);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Search for similar documents (GET)
   * URL params:
   * - search: string (required)
   * - n: number
   * - addBefore: number
   * - addAfter: number
   * - filterIds: string[] (comma separated)
   * - filterName: string[] (comma separated)
   * - fullDocument: boolean
   * - filter[category]: string[] (comma separated) - can be multiple filter[xyz] params
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/knowledge/similarity-search",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const searchText = c.req.query("search");
        const userId = c.get("usersId");
        if (!searchText) {
          throw new Error("Search text is required");
        }
        const n = c.req.query("n")
          ? parseInt(c.req.query("n") ?? "3")
          : undefined;
        const addBefore = c.req.query("addBefore")
          ? parseInt(c.req.query("addBefore") ?? "0")
          : undefined;
        const addAfter = c.req.query("addAfter")
          ? parseInt(c.req.query("addAfter") ?? "0")
          : undefined;
        const filterIds = c.req.query("filterIds")
          ? c.req.query("filterIds")?.split(",")
          : undefined;
        const filterName = c.req.query("filterName")
          ? c.req.query("filterName")?.split(",")
          : undefined;
        const fullDocument = c.req.query("fullDocument") === "true";
        const organisationId = c.req.param("organisationId");

        if (!organisationId) {
          throw new Error('Parameter "organisationId" is required');
        }

        // Parse dynamic filters from URL params
        const filter: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(c.req.query())) {
          if (key.startsWith("filter[") && key.endsWith("]")) {
            const category = key.slice(7, -1); // Remove 'filter[' and ']'
            filter[category] = value.split(",");
          }
        }

        log.debug(`GET /knowledge/similarity-search`, {
          searchText,
          n,
          addBefore,
          addAfter,
          filterIds,
          filter,
          filterName,
          organisationId,
        });

        if (fullDocument) {
          const r = await getFullSourceDocumentsForSimilaritySearch({
            searchText,
            n,
            filterKnowledgeEntryIds: filterIds,
            filter,
            filterName,
            organisationId,
            userId,
          });
          return c.json(r);
        }

        const r = await getNearestEmbeddings({
          organisationId,
          searchText,
          n,
          addBeforeN: addBefore,
          addAfterN: addAfter,
          filterKnowledgeEntryIds: filterIds,
          filter,
          filterName,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Parse a knowledge-text entry to a knowledge entry
   * That means it will be splitted, embeddings will be created, store as knowledge-entry
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/parse-document",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = v.parse(parseDocumentValidation, body);
        validateOrganisationId(parsedBody, c.req.param("organisationId"));

        const r = await parseDocument(parsedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a text knowledge entry from a Text
   * This will create a knowledge-text entry
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/from-text",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = v.parse(addFromTextValidation, body);
        validateOrganisationId(parsedBody, c.req.param("organisationId"));

        const r = await createKnowledgeText(parsedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a text knowledge entry from an URL
   * This will parse the URL to markdown and then create a knowledge-text entry
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/from-url",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = v.parse(addFromUrlValidation, body);
        validateOrganisationId(parsedBody, c.req.param("organisationId"));

        const r = await addKnowledgeTextFromUrl(parsedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Create a new knowledge text entry
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const organisationId = c.req.param("organisationId");
        const parsedBody = v.parse(createKnowledgeTextValidation, body);
        validateOrganisationId(parsedBody, organisationId);

        const r = await createKnowledgeText(parsedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Read knowledge text entries
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.query("id");
        const organisationId = c.req.param("organisationId");
        const limit = c.req.query("limit")
          ? parseInt(c.req.query("limit") ?? "10")
          : undefined;
        const page = c.req.query("page")
          ? parseInt(c.req.query("page") ?? "1")
          : undefined;
        const r = await readKnowledgeText({ id, limit, page, organisationId });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a knowledge text entry
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        const body = await c.req.json();
        const parsedBody = v.parse(updateKnowledgeTextValidation, body);
        validateOrganisationId(parsedBody, organisationId);

        const r = await updateKnowledgeText(id, parsedBody);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a knowledge text entry
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");
        await deleteKnowledgeText(id, organisationId);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
