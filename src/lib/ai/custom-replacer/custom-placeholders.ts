import {
  extendKnowledgeEntriesWithTextChunks,
  getKnowledgeEntries,
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
import { speechToText } from "../ai-sdk/stt";
import { getFileFromDb } from "../../storage/db";
import {
  getNumberArgument,
  getStringArgument,
  getStringArrayArgument,
  parseCommaSeparatedPossiblyQuotedString,
} from "./custom-placeholders-helper";
import type { ChatMessageReplacerMeta, PlaceholderParser } from "./replacer";
import type { ChatSessionContext } from "../chat-store";
import type { PlaceholderArgumentDict } from "./replacer";
import type { SourceReturn } from "../ai-sdk/types";

export type ChatStoreVariables = Record<string, string>;
/**
 * Custom App Placeholders
 */
export const customAppPlaceholders: PlaceholderParser[] = [
  {
    // {{#knowledgebase id="xxx"}}
    name: "knowledgebase",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
    }> => {
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
        userId: userId + "",
        organisationId: meta.organisationId,
        id: args.id ? [args.id as string] : undefined,
        filters,
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
      const knowledgeEntries = await getKnowledgeEntries(query).catch((e) => {
        log.error("Error getting plain knowledge", e);
        return [];
      });

      if (knowledgeEntries.length === 0) {
        await log.logCustom(
          { name: meta.chatId },
          "no knowledgebase entries found",
          query
        );
        return { content: "", skipThisBlock: true };
      }
      const knowledgeEntriesWithChunks =
        await extendKnowledgeEntriesWithTextChunks(knowledgeEntries);

      // attach sources to the response
      const sources: SourceReturn[] = knowledgeEntries.map((k) => ({
        type: "knowledge-entry",
        id: k.id,
        label: k.name,
        external: false,
      }));

      return {
        content: knowledgeEntriesWithChunks.map((k) => k.fullText).join("\n"),
        addToMeta: {
          sources,
        },
      };
    },
  },
  {
    // {{#similar_to count="10" before="10" after="10" id="xxx"}}
    name: "similar_to",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
    }> => {
      const searchForVariable = getStringArgument(
        args,
        "searchForVariable",
        "user_input"
      );
      const question = variables[searchForVariable];

      // Parse dynamic filters
      const filters: Record<string, string[]> = {};
      const filterPrefix = "filter:";
      Object.entries(args).forEach(([key, value]) => {
        if (key.startsWith(filterPrefix)) {
          const filterKey = key.substring(filterPrefix.length);
          filters[filterKey] = parseCommaSeparatedPossiblyQuotedString(
            String(value)
          );
        }
      });

      const names = getStringArrayArgument(args, "names");
      const count = getNumberArgument(args, "count");
      const before = getNumberArgument(args, "before");
      const after = getNumberArgument(args, "after");
      const ids = getStringArrayArgument(args, "id");
      const workspaceId = getStringArgument(args, "workspaceId");
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

      const sources: SourceReturn[] = results.map((r) => ({
        type: "knowledge-entry",
        label: r.knowledgeEntryName,
        id: r.knowledgeEntryId,
        external: false,
      }));
      const chunksSources: SourceReturn[] = results.map((r) => ({
        type: "knowledge-chunk",
        label: `Chunk: ${r.knowledgeEntryName} ${r.meta.page ? `[Page ${r.meta.page}]` : ""}`,
        id: r.id,
        external: false,
      }));

      return {
        content: results.map((r) => r.text).join("\n"),
        addToMeta: {
          sources: [...sources, ...chunksSources],
        },
      };
    },
  },
  {
    // {{#file id="xxx"}}
    name: "file",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
    }> => {
      if (!args.id) {
        throw new Error("id parameter is required for file placeholder");
      }

      const fileSource = (args.source || "db") as FileSourceType;
      const bucket = getStringArgument(args, "bucket", "default");
      const ids = getStringArrayArgument(args, "id", []);
      const organisationId = meta.organisationId;

      let text = "";
      const documentTitles: Record<string, string> = {};

      for (const id of ids) {
        if (id === "") {
          continue;
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
        
        if (document) {
          text += document.content ?? "";
          documentTitles[id] = document.title ?? id;
        }
      }

      const fileSources: SourceReturn[] = ids.map((id) => ({
        type: "file",
        id,
        label: documentTitles[id] || id,
        external: false,
      }));

      return {
        content: text,
        addToMeta: {
          sources: fileSources,
        }
      };
    },
  },
  {
    // {{#url html="xxx"}}
    name: "url",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
    }> => {
      let url = getStringArgument(args, "url");
      if (!url) {
        url = getStringArgument(args, "html");
      }
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
    // {{#prompt_snippet name="xxx" category="xxx"}}
    name: "prompt_snippet",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
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
    // {{#knowledge_text title="xxx"}}
    name: "knowledge_text",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
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
    // {{#stt id="xxx"}}
    name: "stt",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
      addToMeta?: ChatMessageReplacerMeta;
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
          chatId: meta.chatId,
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
];
