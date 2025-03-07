/**
 * Routes to manage the knowledge entries for each organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  extractKnowledgeFromExistingDbEntry,
  extractKnowledgeFromText,
  extractKnowledgeInOneStep,
} from "../../../../../lib/ai/knowledge/add-knowledge";
import { parseDocument } from "../../../../../lib/ai/parsing";
import {
  deleteKnowledgeEntry,
  getFullSourceDocumentsForKnowledgeEntry,
  getKnowledgeEntries,
  updateKnowledgeEntry,
} from "../../../../../lib/ai/knowledge/get-knowledge";
import { RESPONSES } from "../../../../../lib/responses";
import {
  getFullSourceDocumentsForSimilaritySearch,
  getNearestEmbeddings,
} from "../../../../../lib/ai/knowledge/similarity-search";
import {
  createKnowledgeText,
  getKnowledgeText,
  updateKnowledgeText,
  deleteKnowledgeText,
} from "../../../../../lib/ai/knowledge/knowledge-texts";
import { addKnowledgeTextFromUrl } from "../../../../../lib/ai/knowledge-texts";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { validateOrganisationId } from "../../../../../lib/utils/doublecheck-organisation";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import {
  knowledgeEntrySchema,
  knowledgeTextInsertSchema,
  knowledgeTextUpdateSchema,
} from "../../../../../dbSchema";
import { isOrganisationAdmin, isOrganisationMember } from "../../..";

const FileSourceType = {
  DB: "db",
  LOCAL: "local",
  URL: "url",
  TEXT: "text",
  EXTERNAL: "external",
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

const addFromTextValidation = v.object({
  organisationId: v.string(),
  text: v.string(),
  title: v.string(),
  filters: v.optional(v.record(v.string(), v.string())),
  teamId: v.optional(v.string()),
  userId: v.optional(v.string()),
  workspaceId: v.optional(v.string()),
  meta: v.optional(
    v.object({
      sourceUri: v.string(),
      sourceId: v.string(),
    })
  ),
});

const addFromUrlValidation = v.object({
  organisationId: v.string(),
  url: v.string(),
});

const uploadAndLearnValidation = v.object({
  organisationId: v.string(),
  filters: v.optional(v.record(v.string(), v.string())),
  teamId: v.optional(v.string()),
  userId: v.optional(v.string()),
  workspaceId: v.optional(v.string()),
  text: v.optional(v.string()),
  meta: v.optional(
    v.object({
      sourceUri: v.string(),
      sourceId: v.string(),
    })
  ),
});

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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/extract-knowledge",
      tags: ["knowledge"],
      summary: "Extract knowledge from a document",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  id: v.string(),
                  ok: v.boolean(),
                })
              ),
            },
          },
        },
      },
    }),
    validator("json", generateKnowledgeValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const r = await extractKnowledgeFromExistingDbEntry(body);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
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
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/knowledge/entries",
      tags: ["knowledge"],
      summary: "Get all knowledge entries",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(knowledgeEntrySchema)),
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        limit: v.optional(v.string()),
        page: v.optional(v.string()),
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const {
          limit: limitStr,
          page: pageStr,
          teamId,
          workspaceId,
        } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");
        const usersId = c.get("usersId");

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
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/knowledge/entries/:id",
      tags: ["knowledge"],
      summary: "Get a full source document for a knowledge entry by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
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
   * Update a knowledge entry by ID
   * Only the name can be updated
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/entries/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/knowledge/entries/:id",
      tags: ["knowledge"],
      summary: "Update a knowledge entry by ID. Only the name can be updated.",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    validator("json", v.object({ name: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const usersId = c.get("usersId");
        const data = c.req.valid("json");

        const r = await updateKnowledgeEntry(id, organisationId, usersId, data);

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
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/knowledge/entries/:id",
      tags: ["knowledge"],
      summary: "Delete a knowledge entry by ID",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const usersId = c.get("usersId");
        await deleteKnowledgeEntry(id, organisationId, usersId);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Similarity search
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/knowledge/similarity-search",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/similarity-search",
      tags: ["knowledge"],
      summary: "Search for similar documents",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", similaritySearchValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        if (body.searchText.length < 3) {
          throw new Error("Search text must be at least 3 characters long");
        }

        if (body.fullDocument) {
          const r = await getFullSourceDocumentsForSimilaritySearch({
            organisationId: body.organisationId,
            searchText: body.searchText,
            n: body.n,
            filterKnowledgeEntryIds: body.filterKnowledgeEntryIds,
            filter: body.filter,
            filterName: body.filterName,
            userId,
          });
          return c.json(r);
        }

        const r = await getNearestEmbeddings({
          organisationId: body.organisationId,
          searchText: body.searchText,
          n: body.n,
          addBeforeN: body.addBeforeN,
          addAfterN: body.addAfterN,
          filterKnowledgeEntryIds: body.filterKnowledgeEntryIds,
          filter: body.filter,
          filterName: body.filterName,
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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/parse-document",
      tags: ["knowledge"],
      summary: "Parse a knowledge-text entry to a knowledge entry",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator("json", parseDocumentValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const r = await parseDocument(body);
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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/from-text",
      tags: ["knowledge"],
      summary: "Add a text knowledge entry from text",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator("json", addFromTextValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const data = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(data, organisationId);

        const r = await extractKnowledgeFromText({
          organisationId: data.organisationId,
          title: data.title,
          text: data.text,
          filters: data.filters,
          teamId: data.teamId,
          workspaceId: data.workspaceId,
          sourceExternalId: data.meta?.sourceId ?? data.title,
          sourceType: "external",
          sourceFileBucket: "default",
          sourceUrl: data.meta?.sourceUri ?? data.title,
        });

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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/from-url",
      tags: ["knowledge"],
      summary: "Add a text knowledge entry from URL",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator("json", addFromUrlValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const r = await addKnowledgeTextFromUrl(body);
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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/texts",
      tags: ["knowledge"],
      summary: "Create a new knowledge text entry",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", knowledgeTextInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const r = await createKnowledgeText({
          ...body,
          userId: c.get("usersId"),
        });
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
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/knowledge/texts",
      tags: ["knowledge"],
      summary: "Read knowledge text entries",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(knowledgeEntrySchema)),
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        id: v.optional(v.string()),
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
        limit: v.optional(v.string()),
        page: v.optional(v.string()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const {
          id,
          teamId,
          workspaceId,
          limit: limitStr,
          page: pageStr,
        } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");
        const limit = limitStr ? parseInt(limitStr) : undefined;
        const page = pageStr ? parseInt(pageStr) : undefined;

        const r = await getKnowledgeText({
          id,
          limit,
          page,
          organisationId,
          userId,
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
   * Update a knowledge text entry
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/knowledge/texts/:id",
      tags: ["knowledge"],
      summary: "Update a knowledge text entry",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator("json", knowledgeTextUpdateSchema),
    validator(
      "query",
      v.object({
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
      })
    ),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { teamId, workspaceId } = c.req.valid("query");
        const { organisationId, id } = c.req.valid("param");
        const body = c.req.valid("json");
        const userId = c.get("usersId");
        validateOrganisationId(body, organisationId);

        const r = await updateKnowledgeText(id, body, {
          organisationId,
          userId,
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
   * Delete a knowledge text entry
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/knowledge/texts/:id",
      tags: ["knowledge"],
      summary: "Delete a knowledge text entry",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "query",
      v.object({
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
      })
    ),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { teamId, workspaceId } = c.req.valid("query");
        const { organisationId, id } = c.req.valid("param");
        const userId = c.get("usersId");

        await deleteKnowledgeText(id, {
          organisationId,
          userId,
          teamId,
          workspaceId,
        });
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Upload a file, learn from it, and then delete it
   * This endpoint combines file upload and knowledge extraction in one step
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/knowledge/upload-and-learn",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/upload-and-learn",
      tags: ["knowledge"],
      summary: "Upload a file and extract knowledge in one step",
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: resolver(
              v.object({
                file: v.any(),
                teamId: v.optional(v.string()),
                workspaceId: v.optional(v.string()),
                filters: v.optional(v.string()),
              })
            ),
          },
          "application/json": {
            schema: resolver(uploadAndLearnValidation),
          },
        },
      },
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  id: v.string(),
                  ok: v.boolean(),
                })
              ),
            },
          },
        },
        400: {
          description: "Bad request",
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      const organisationId = c.req.param("organisationId");
      const contentType = c.req.header("content-type");
      const userId = c.get("usersId");

      let data;
      let file;
      let teamId;
      let workspaceId;
      let filters;

      if (contentType && contentType.includes("multipart/form-data")) {
        const form = await c.req.formData();
        teamId = form.get("teamId")?.toString();

        if (teamId && teamId === "") {
          teamId = undefined;
        }
        workspaceId = form.get("workspaceId")?.toString();
        if (workspaceId && workspaceId === "") {
          workspaceId = undefined;
        }
        try {
          filters = form.get("filters")
            ? JSON.parse(form.get("filters")?.toString() || "{}")
            : undefined;
        } catch (e) {
          throw new HTTPException(400, {
            message: "Error parsing filters from form-data.",
          });
        }
        file = form.get("file") as File;
        data = {
          userId,
          organisationId,
          teamId,
          workspaceId,
          filters,
        };
      } else {
        data = await c.req.json();
        data = {
          ...data,
          organisationId,
          userId,
        };
      }

      try {
        const parsedData = v.parse(uploadAndLearnValidation, data);
        const r = await extractKnowledgeInOneStep(
          { ...parsedData, file },
          true
        );
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
