import {
  getKnowledgeEntries,
  getPlainKnowledge,
} from "../knowledge/get-knowledge";
import type { FileSourceType } from "../../../lib/storage";
import { parseDocument } from "../parsing";
import { getNearestEmbeddings } from "../knowledge/similarity-search";
import { getMarkdownFromUrl } from "../parsing/url";
import {
  getPromptSnippetById,
  getPromptSnippetByNameAndCategory,
} from "../prompt-snippets";
import { getKnowledgeTextByTitle } from "../knowledge/knowledge-texts";
import log from "../../log";
import type {
  ChatSessionContext,
  PlaceholderArgumentDict,
  ChatStoreVariables,
  PlaceholderParser,
} from "./chat-store";
import { speechToText } from "../ai-sdk/stt";
import { getFileFromDb } from "../../storage/db";
import {
  getBooleanArgument,
  getNumberArgument,
  getStringArgument,
  getStringArrayArgument,
  getIndexValue,
  incrementIndexValue,
  isNumber,
} from "./custom-placeholders-helper";

/**
 * Custom App Placeholders
 */
export const customAppPlaceholders: PlaceholderParser[] = [
  {
    name: "inc_value",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      if (!args.variable) {
        throw new Error(
          "variable parameter is required for inc_value placeholder"
        );
      }
      const varName = args.variable + "";
      const actualValue: number = isNumber(variables[varName]) ?? 0;
      const increaseBy: number = isNumber(args.increase) ?? 1;

      variables[varName] = actualValue + increaseBy;
      return { content: "" };
    },
  },
  {
    name: "knowledgebase",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      let pointerName = getStringArgument(args, "pointer", "_chunk_offset");
      let autoIncrease = getBooleanArgument(args, "auto_increase", true);

      let chunkOffset = getNumberArgument(args, pointerName, 0);
      let chunkCount = getNumberArgument(args, "chunk_count");

      // Parse dynamic filters
      const filters: Record<string, string[]> = {};
      Object.entries(args).forEach(([key, value]) => {
        if (key.startsWith("filter:")) {
          const filterKey = key.substring(7); // Remove 'filter:' prefix
          filters[filterKey] = String(value).split(",");
        }
      });

      const userId = meta.userId;
      const query = {
        id: args.id ? [args.id as string] : undefined,
        filters,
        chunkCount,
        chunkOffset,
        userId: userId + "",
        organisationId: meta.organisationId,
      };

      await log.logCustom(
        { name: meta.chatId },
        "parse knowledgebase for userid",
        userId + ""
      );
      await log.logCustom(
        { name: meta.chatId },
        "parse knowledgebase placeholder",
        query
      );
      const knowledgebase = await getPlainKnowledge(query).catch((e) => {
        log.error("Error getting plain knowledge", e);
        return [];
      });

      if (knowledgebase.length === 0) {
        await log.logCustom(
          { name: meta.chatId },
          "no knowledgebase entries found",
          query
        );
        return { content: "", skipThisBlock: true };
      }

      // write back to variables
      if (chunkCount && autoIncrease) {
        variables[pointerName] = chunkOffset + chunkCount;
      }
      return {
        content: knowledgebase.map((k) => k.text).join("\n"),
        addToMeta: {
          documents: {
            knowledgeEntries: await getKnowledgeEntries({
              organisationId: meta.organisationId,
              ids: knowledgebase.map((k) => k.knowledgeEntryId),
              userId: meta.userId,
            }),
          },
          chunks: knowledgebase.map((k) => ({
            id: k.knowledgeEntryId,
            text: k.text,
            meta: k.meta,
          })),
        },
      };
    },
  },
  {
    name: "similar_to",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      const searchForVariable = getStringArgument(
        args,
        "search_for_variable",
        "user_input"
      );
      const question = variables[searchForVariable];

      // Parse dynamic filters
      const filters: Record<string, string[]> = {};
      Object.entries(args).forEach(([key, value]) => {
        if (key.startsWith("filter:")) {
          const filterKey = key.substring(7); // Remove 'filter:' prefix
          filters[filterKey] = String(value).split(",");
        }
      });

      const names = getStringArrayArgument(args, "names");
      const count = getNumberArgument(args, "count");
      const before = getNumberArgument(args, "before");
      const after = getNumberArgument(args, "after");
      const ids = getStringArrayArgument(args, "id");
      const workspaceId = getStringArgument(args, "workspace_id");
      const organisationId = meta.organisationId;

      await log.logCustom(
        { name: meta.chatId },
        "parse similar_to placeholder",
        {
          organisationId,
          workspaceId,
          searchText: question,
          count,
          ids,
          filters,
          names,
          before,
          after,
        }
      );
      const results = await getNearestEmbeddings({
        organisationId: organisationId,
        workspaceId,
        searchText: String(question),
        n: count,
        filterKnowledgeEntryIds: ids,
        filter: filters,
        filterName: names,
        addBeforeN: before,
        addAfterN: after,
      }).catch((e) => {
        log.error("Error getting nearest embeddings", e);
        return [];
      });

      return {
        content: results.map((r) => r.text).join("\n"),
        addToMeta: {
          documents: {
            knowledgeEntries: await getKnowledgeEntries({
              organisationId: organisationId,
              ids: results.map((r) => r.knowledgeEntryId),
              userId: meta.userId,
            }),
          },
          chunks: results.map((r) => ({
            id: r.knowledgeEntryId,
            text: r.text,
            meta: r.meta,
          })),
        },
      };
    },
  },
  {
    name: "file",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      if (!args.id) {
        throw new Error("id parameter is required for file placeholder");
      }

      const fileSource = (args.source || "db") as FileSourceType;
      const bucket = getStringArgument(args, "bucket", "default");
      const ids = getStringArrayArgument(args, "id", []);
      const indexName = getStringArgument(args, "index", "ix_file_id");
      const organisationId = meta.organisationId;

      let id = "";
      let ixValue = getIndexValue(variables, indexName);
      if (ids.length === 0) {
        return { content: "" };
      } else if (ids.length === 1) {
        id = ids[0];
      } else {
        id = ids[ixValue] ?? undefined;
        incrementIndexValue(variables, indexName);
        log.logCustom({ name: meta.chatId }, "read file index", ixValue);
      }

      if (!id) {
        log.logCustom({ name: meta.chatId }, "no more files to read");
        return { content: "", skipThisBlock: true };
      }

      await log.logCustom({ name: meta.chatId }, "parse file placeholder", {
        fileSource,
        bucket,
        id,
      });
      const document = await parseDocument({
        sourceType: fileSource,
        organisationId: organisationId,
        sourceId: id,
        sourceFileBucket: bucket,
      }).catch((e) => {
        log.error("Error parsing document", e);
        return null;
      });

      return {
        content: document?.content ?? "",
        addToMeta: {
          fileIds: [id],
        },
      };
    },
  },
  {
    name: "url",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      const url = getStringArgument(args, "url");
      if (!url) {
        throw new Error("url parameter is required for url placeholder");
      }
      await log.logCustom({ name: meta.chatId }, "parse url placeholder", {
        url,
      });
      const markdown = await getMarkdownFromUrl(url).catch((e) => {
        log.error("Error getting markdown from url", e);
        return "";
      });
      return { content: markdown };
    },
  },
  {
    name: "prompt_snippet",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      const name = getStringArgument(args, "name");
      const category = getStringArgument(args, "category");
      const organisationId = meta.organisationId;
      const id = getStringArgument(args, "id");

      if (name && category) {
        const snippet = await getPromptSnippetByNameAndCategory({
          name,
          category,
          organisationId,
        }).catch((e) => {
          log.error("Error getting prompt snippet", e);
          return null;
        });
        return { content: snippet?.content ?? "" };
      } else if (id) {
        const snippet = await getPromptSnippetById(id, organisationId).catch(
          (e) => {
            log.error("Error getting prompt snippet", e);
            return null;
          }
        );
        return { content: snippet?.content ?? "" };
      } else {
        throw new Error(
          "name, category or id parameter is required for prompt_snippet placeholder"
        );
      }
    },
  },
  {
    name: "knowledge_text",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      const title = getStringArgument(args, "title");
      const organisationId = meta.organisationId;

      if (!title) {
        throw new Error(
          "title parameter is required for knowledge_text placeholder"
        );
      }

      const text = await getKnowledgeTextByTitle({
        title,
        organisationId,
      }).catch((e) => {
        log.error("Error getting knowledge text", e);
        return null;
      });
      return { content: text?.text ?? "" };
    },
  },
  {
    name: "inc_value",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      if (!args.variable) {
        throw new Error(
          "variable parameter is required for inc_value placeholder"
        );
      }
      const varName = getStringArgument(args, "variable");
      if (!varName) {
        throw new Error(
          "variable parameter is required for inc_value placeholder"
        );
      }
      const actualValue = getIndexValue(variables, varName);
      const increaseBy: number = getNumberArgument(args, "increase", 1);

      variables[varName] = actualValue + increaseBy;
      return { content: "" };
    },
  },

  {
    name: "stt",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      if (!args.id) {
        throw new Error("id parameter is required for stt placeholder");
      }

      const fileSource = (args.source || "db") as FileSourceType;
      const bucket = args.bucket ? args.bucket + "" : "default";
      const id = args.id + "";
      const organisationId = meta.organisationId;

      // Get file from storage
      const file = await getFileFromDb(id, bucket, organisationId).catch(
        (e) => {
          log.error("Error getting file", e);
          return null;
        }
      );

      if (!file) {
        log.error("File not found", id);
        return { content: "" };
      }

      // Check if file is an audio file
      if (!file.type?.startsWith("audio/")) {
        log.error("File is not an audio file", file.type);
        return { content: "" };
      }

      // Convert speech to text
      const transcription = await speechToText(
        file,
        {
          organisationId: meta.organisationId,
          userId: meta.userId,
        },
        {
          returnSegments: false,
          returnWords: false,
        }
      ).catch((e) => {
        log.error("Error transcribing audio", e);
        return null;
      });

      if (!transcription) {
        return { content: "" };
      }

      return { content: transcription.text };
    },
  },

  {
    name: "iterate_array",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: Record<string, any>;
    }> => {
      // get name of the array variable
      if (!args.name) {
        log.error(
          "parsing iterate_array placeholder: name parameter is required"
        );
        return { content: "" };
      }
      const varName = args.name + "";

      if (!variables[varName] || !Array.isArray(variables[varName])) {
        log.error(
          "parsing iterate_array placeholder: variable not found",
          varName
        );
        return { content: "" };
      }

      const ixName = "ix_" + varName;
      const ixValue = getIndexValue(variables, ixName);
      log.logCustom({ name: meta.chatId }, "iterate_array", {
        ixName,
        ixValue,
      });

      // get value from array
      if (ixValue >= variables[varName].length) {
        return { content: "", skipThisBlock: true };
      }

      // read value
      const val = variables[varName][ixValue];
      // increment index
      incrementIndexValue(variables, ixName);
      return { content: val + "" };
    },
  },
];
