import log from "../../log";
import type { SourceReturn } from "../ai-sdk/types";
import type { ChatSessionContext } from "../chat-store";
import { parseArgumentsWithoutLimits } from "./parse-arguments";
import type { CoreMessage } from "ai";

export type PlaceholderArgumentDict = Record<
  string,
  string | number | boolean | undefined
>;

export type ChatMessageReplacerMeta = {
  sources?: SourceReturn[];
};

export type PlaceholderParser = {
  name: string;
  expression?: RegExp; // e.g. /{{#url="([^"]+)"(?:\s+(?:comment)=(?:"[^"]*"|[^}\s]+))*}}/
  requiredArguments?: string[]; // a simple list of required arguments for the placeholder
  arguments?: {
    // a complex list of arguments for the placeholder
    name: string;
    required?: boolean;
    type?: "string" | "number" | "boolean";
    multiple?: boolean;
    default?: string | number | boolean;
  }[];
  replacerFunction: (
    match: string,
    args: PlaceholderArgumentDict,
    variables: Record<string, string>,
    meta: ChatSessionContext
  ) => Promise<{
    content: string;
    skipThisBlock?: boolean;
    addToMeta?: ChatMessageReplacerMeta;
  }>;
};

/**
 * Find all variables {{var_name}} and replace them with the actual value
 */
export const replaceVariables = async (
  messages: CoreMessage[],
  variables: Record<string, string>
) => {
  const replacedMessages: CoreMessage[] = [];
  for (const message of messages) {
    let replacedMessage = JSON.parse(JSON.stringify(message));
    const matches = replacedMessage.content.match(/{{\s*(\w+)\s*}}/g);

    if (matches) {
      for (const match of matches) {
        const variableName = match.replace(/{{\s*(\w+)\s*}}/, "$1");
        const value = variables[variableName];

        if (value) {
          const returnValue = Array.isArray(value)
            ? value.map((v) => `"${v}"`).join("\n\n")
            : value;
          log.debug(`Replacing "${match}" with "${returnValue}"`);

          replacedMessage.content = replacedMessage.content.replace(
            match,
            returnValue
          );
        } else {
          log.debug(`No replacement for "${match}"`);
        }
      }
    }
    replacedMessages.push(replacedMessage);
  }
  return replacedMessages;
};

/**
 * Find all custom placeholders like {{#custom ...}} and replace them
 */
export const replaceCustomPlaceholders = async (
  messages: CoreMessage[],
  parsers: PlaceholderParser[],
  variables: Record<string, string>,
  meta: ChatSessionContext
) => {
  const replacedMessages: CoreMessage[] = [];
  let skipThisBlock = false;
  const addToMeta: ChatMessageReplacerMeta = {};

  for (const message of messages) {
    let replacedMessage = JSON.parse(JSON.stringify(message));

    for (const parser of parsers) {
      if (!parser.expression) {
        parser.expression = new RegExp(`{{#${parser.name}([^}]*?)}}`, "g");
      }

      if (
        !replacedMessage.content ||
        typeof replacedMessage.content !== "string"
      ) {
        continue;
      }

      const matches = replacedMessage.content.match(parser.expression);
      if (matches) {
        // Process all matches sequentially
        for (const match of matches) {
          const args = parseArgumentsWithoutLimits(match, parser.name);
          const replacement = await parser.replacerFunction(
            match,
            args,
            variables,
            meta
          );
          skipThisBlock = replacement.skipThisBlock ?? false;
          replacedMessage.content = replacedMessage.content.replace(
            match,
            replacement.content
          );
          // Merge addToMeta data if present
          if (replacement.addToMeta?.sources) {
            // assign sources
            addToMeta.sources
              ? addToMeta.sources.push(...replacement.addToMeta.sources)
              : (addToMeta.sources = replacement.addToMeta.sources);
          }
        }
      }
    }
    replacedMessages.push(replacedMessage);
  }
  return {
    replacedMessages,
    skipThisBlock,
    addToMeta,
  };
};
