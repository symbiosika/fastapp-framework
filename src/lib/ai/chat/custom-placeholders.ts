import { getPlainKnowledge } from "../knowledge/get-knowledge";
import type { FileSourceType } from "../../../lib/storage";
import { parseDocument } from "../parsing";
import { getNearestEmbeddings } from "../knowledge/similarity-search";
import { getMarkdownFromUrl } from "../parsing/url";
import { getPromptSnippetByNameAndCategory } from "../prompt-snippets";
import { getKnowledgeTextByTitle } from "../knowledge/knowledge-texts";
import log from "../../log";
import type {
  ChatSessionContext,
  PlaceholderArgumentDict,
  ChatStoreVariables,
  PlaceholderParser,
} from "./chat-store";

const isNumber = (value: unknown): number | null | undefined => {
  if (value && typeof value === "number" && !isNaN(value)) {
    return value;
  }
  return null;
};

const getIndexValue = (variables: ChatStoreVariables, indexName: string) => {
  if (
    !variables[indexName] ||
    typeof variables[indexName] !== "number" ||
    isNaN(variables[indexName])
  ) {
    variables[indexName] = 0;
  }
  return variables[indexName];
};

const incrementIndexValue = (
  variables: ChatStoreVariables,
  indexName: string
) => {
  const ixValue = getIndexValue(variables, indexName);
  variables[indexName] = ixValue + 1;
};

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
    ) => {
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
    }> => {
      let pointerName = args.pointer ? args.pointer + "" : "_chunk_offset";

      let autoIncrease =
        args.auto_increase && typeof args.auto_increase === "boolean"
          ? args.auto_increase
          : true;

      let chunkOffset = isNumber(variables[pointerName]) ?? 0;
      let chunkCount = isNumber(args.chunk_count) ?? undefined;

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
      };

      await log.debug("parse knowledgebase for userid", userId + "");
      await log.debug("parse knowledgebase placeholder", query);
      const knowledgebase = await getPlainKnowledge(query).catch((e) => {
        log.error("Error getting plain knowledge", e);
        return [];
      });

      if (knowledgebase.length === 0) {
        await log.debug("no knowledgebase entries found", query);
        return { content: "", skipThisBlock: true };
      }

      // write back to variables
      if (chunkCount && autoIncrease) {
        variables[pointerName] = chunkOffset + chunkCount;
      }
      return { content: knowledgebase.map((k) => k.text).join("\n") };
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
    }> => {
      const searchForVariable = args.search_for_variable
        ? args.search_for_variable + ""
        : "user_input";
      const question = variables[searchForVariable];

      // Parse dynamic filters
      const filters: Record<string, string[]> = {};
      Object.entries(args).forEach(([key, value]) => {
        if (key.startsWith("filter:")) {
          const filterKey = key.substring(7); // Remove 'filter:' prefix
          filters[filterKey] = String(value).split(",");
        }
      });

      const names = args.names ? String(args.names).split(",") : undefined;
      const count =
        args.count && typeof args.count === "number" ? args.count : undefined;
      const before =
        args.before && typeof args.before === "number"
          ? args.before
          : undefined;
      const after =
        args.after && typeof args.after === "number" ? args.after : undefined;
      const ids = args.id ? (args.id as string).split(",") : undefined;
      const organisationId = args.organisationId
        ? args.organisationId + ""
        : "";

      await log.debug("parse similar_to placeholder", {
        organisationId,
        searchText: question,
        count,
        ids,
        filters,
        names,
        before,
        after,
      });
      const results = await getNearestEmbeddings({
        organisationId: organisationId,
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

      return { content: results.map((r) => r.text).join("\n") };
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
    }> => {
      if (!args.id) {
        throw new Error("id parameter is required for file placeholder");
      }

      const fileSource = (args.source || "db") as FileSourceType;
      const bucket = args.bucket ? args.bucket + "" : "default";
      const ids = args.id ? (args.id as string).split(",") : [];
      const indexName = args.index ? args.index + "" : "ix_file_id";
      const organisationId = args.organisationId
        ? args.organisationId + ""
        : "";

      let id = "";
      let ixValue = getIndexValue(variables, indexName);
      if (ids.length === 0) {
        return { content: "" };
      } else if (ids.length === 1) {
        id = ids[0];
      } else {
        id = ids[ixValue] ?? undefined;
        incrementIndexValue(variables, indexName);
        log.debug("read file index", ixValue);
      }

      if (!id) {
        log.debug("no more files to read");
        return { content: "", skipThisBlock: true };
      }

      await log.debug("parse file placeholder", { fileSource, bucket, id });
      const document = await parseDocument({
        sourceType: fileSource,
        organisationId: organisationId,
        sourceId: id,
        sourceFileBucket: bucket,
      }).catch((e) => {
        log.error("Error parsing document", e);
        return null;
      });

      return { content: document?.content ?? "" };
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
    }> => {
      if (!args.url) {
        throw new Error("url parameter is required for url placeholder");
      }
      const url = args.url + "";
      await log.debug("parse url placeholder", { url });
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
    ) => {
      console.log("parse prompt_snippet placeholder", args);
      const snippet = await getPromptSnippetByNameAndCategory({
        name: args.name + "",
        category: args.category + "",
        organisationId: args.organisationId + "",
      }).catch((e) => {
        log.error("Error getting prompt snippet", e);
        return null;
      });
      console.log("snippet", snippet);
      return { content: snippet?.content ?? "" };
    },
  },
  {
    name: "knowledge_text",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ) => {
      const text = await getKnowledgeTextByTitle({
        title: args.title + "",
        organisationId: args.organisationId + "",
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
    ) => {
      if (!args.variable) {
        throw new Error(
          "variable parameter is required for inc_value placeholder"
        );
      }
      const varName = args.variable + "";
      const actualValue = getIndexValue(variables, varName);
      const increaseBy: number = isNumber(args.increase) ?? 1;

      variables[varName] = actualValue + increaseBy;
      return { content: "" };
    },
  },
  {
    name: "iterate_array",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: ChatStoreVariables,
      meta: ChatSessionContext
    ) => {
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
      log.debug("iterate_array", { ixName, ixValue });

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
