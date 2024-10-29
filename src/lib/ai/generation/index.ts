/**and,
 * A library to generate texts or answers using a prompt template.
 * The prompt template is defined in the database and can be used to generate texts for different purposes.
 * A prompt template is a text with placeholders. The placeholders are replaced with values from the database or from the user.
 * A template can also contain multiple dialogs with different roles. These dialogs are executed sequencially to reach a complex generation result.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import { promptTemplates } from "../../../lib/db/db-schema";
import { generateLongText, type Message } from "../standard";
import log from "../../../lib/log";
import type { GenerateByTemplateInput } from "../../../routes/ai";
import { getPlainKnowledge } from "../knowledge/get-knowledge";
import { FileSourceType } from "src/lib/storage";
import { parseDocument } from "../parsing";
import { getNearestEmbeddings } from "../knowledge/similarity-search";

type PlaceholderData = Record<
  string,
  string | number | boolean | null | undefined
>;

type RawBlock = {
  template: string;
  outputVarName: string;
  forget: boolean;
  outputType: "text" | "json";
};

type MessageBlock = {
  messages: Message[];
  outputVarName: string;
  forget: boolean;
  outputType: "text" | "json";
};

/*
Beispiel: "Erzeuge einen Text für CSRD Bericht für den Abschnitt ESR "Entsorgung von Abfällen"
Nötige Schritte:
- Erzeuge das Wissen darüber wie ein CSRD Bericht für den Abschnitt ESR "Entsorgung von Abfällen" aufgebaut ist und welche Inhalte notwendig sind
- Erzeuge einen Text für CSRD Bericht für den Abschnitt ESR "Entsorgung von Abfällen" aus den Informationen die der User gesammelt hast

Beispiel 2: "Erzeuge einen Podcast aus einem langen Text"
Nötige Schritte:
- Sammle alle relevanten Informationen aus dem langen Text
- Bereite die Informationen in einem Podcast Format vor ()

Um das zu erreichen kann es nötig sein mehrere Prompts hintereinander auszuführen.
Das Template besteht aus mehreren Abschnitten.
Im Template kann angegeben werden, welche Rollen im Prompt verwendet werden.
Werden keine Rollen ist der erste Prompt automatisch die Rolle "system" und der zweite Prompt die Rolle "user".
Außerdem gibt es noch die Rolle "assistant".

Ein Prompt Template ist wie folgt aufgebaut:

{{#role=system}}
...text...
...text...
{{/role}}
{{#role=user}}
...text...
{{/role}}
{{inputText}}

{{#break output=someVariableName}}

{{#role=assistant}}

...text...

...{{someVariableName}}...

...{{#knowledgebase id?=a category1?=a,b category2?=a,b category3?=a,b name?=a,b}}...

...{{#similar_to search_for=a id?=a category1?=a,b category2?=a,b category3?=a,b name?=a,b}}...

...{{#file id=32ed9101-0887-4be0-b92c-204d8e7239dd fileSource=db}}...
{{/role}}

{{#break output=someVariableNameTwo forget=true output_type=json}}

{{#role=assistant}}
...{{someVariableNameTwo}}...
{{/role}}

{{#break}}

Jeder BREAK-Block hat einen Output.
Das keyword "output" gibt optional einen Namen für die Output-Variable an.
Der Default Name ist "output".

Jeder BREAK-Block hat optional das keyword "forget".
Wird dieses gesetzt, werden alle Messages nach Abschluss des Blocks verworfen und der "Chat" beginnt neu.
Dies kann sinnvoll sein um einen besseren Gesamt-Context zu erhalten.

Das Gesamtergebnis ist ein Dictionary mit allen Output-Variablen-Namen.
Aus dem Beispiel ergbit sich also:
{
  someVariableName: string;
  someVariableNameTwo: string;
  output: string;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
*/

/**
 * Hepler to get a prompt template from the database by id.
 */
const getPromptTemplateById = async (
  promptId: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(
      eq(promptTemplates.hidden, false),
      eq(promptTemplates.id, promptId)
    );
  } else {
    where = eq(promptTemplates.id, promptId);
  }
  const result = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      promptTemplatePlaceholders: true,
    },
  });
  if (!result) {
    throw new Error("Sorry. The prompt template was not found.");
  }
  return result;
};

/**
 * Helper to get a prompt template from the database by name and category.
 */
const getPromptTemplateByNameAndCategory = async (
  promptName: string,
  promptCategory: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(
      eq(promptTemplates.hidden, false),
      eq(promptTemplates.name, promptName),
      eq(promptTemplates.category, promptCategory)
    );
  } else {
    where = and(
      eq(promptTemplates.name, promptName),
      eq(promptTemplates.category, promptCategory)
    );
  }
  const result = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      promptTemplatePlaceholders: true,
    },
  });
  if (!result) {
    throw new Error("Sorry. The prompt template was not found.");
  }
  return result;
};

/**
 * Helper to shorten a string by replacing the middle with "...".
 * Unit-Tested: Yes
 */
export const shortenString = (
  val: string | number | boolean | null | undefined,
  maxLength: number
) => {
  const str = (val + "").replace(/[\r\n]+/g, " ").trim();
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
};

type KnowledgebaseQuery = {
  fullMatch: string;
  id?: string[]; // Changed from string to string[]
  category1?: string[];
  category2?: string[];
  category3?: string[];
  names?: string[];
};

/**
 * Helper to replace a knowledgebase entry in a template.
 * Finds: {{#knowledgebase id?=a category?=a,b name?=a,b}}
 * Unit-Tested: Yes
 */
export const parseKnowledgebaseQueries = (template: string) => {
  const regExp =
    /{{#knowledgebase(?:\s+(?:id|category[1-3]|name|comment)=(?:"[^"]*"|[^}\s]+))*}}/g;

  const queries: KnowledgebaseQuery[] = [];
  for (const match of template.matchAll(regExp)) {
    const fullMatch = match[0];

    const idMatch = fullMatch.match(/id=([^}\s]+)/);
    const category1Match = fullMatch.match(/category1=([^}\s]+)/);
    const category2Match = fullMatch.match(/category2=([^}\s]+)/);
    const category3Match = fullMatch.match(/category3=([^}\s]+)/);
    const namesMatch = fullMatch.match(/name=([^}\s]+)/);

    if (
      !idMatch &&
      !category1Match &&
      !category2Match &&
      !category3Match &&
      !namesMatch
    ) {
      log.error(
        `No knowledgebase query was found in the template: ${template}`
      );
      continue;
    }

    queries.push({
      fullMatch,
      id: idMatch?.[1]?.split(","), // Changed to split by comma like other fields
      category1: category1Match?.[1]?.split(","),
      category2: category2Match?.[1]?.split(","),
      category3: category3Match?.[1]?.split(","),
      names: namesMatch?.[1]?.split(","),
    });
  }
  return queries;
};

type SimilarToQuery = {
  fullMatch: string;
  searchFor: string[];
  id?: string[]; // Changed from string to string[]
  category1?: string[];
  category2?: string[];
  category3?: string[];
  names?: string[];
  count?: number;
  before?: number;
  after?: number;
};

/**
 * Helper to replace a similar_to entry in a template.
 * Finds: {{#similar_to search_for=a id?=a category?=a,b name?=a,b count?=n before?=n after?=n}}
 * Unit-Tested: Yes
 */
export const parseSimilarToQueries = (template: string) => {
  const regExp =
    /{{#similar_to(?:\s+(?:search_for|id|category[1-3]|name|count|before|after|comment)=(?:"[^"]*"|[^}\s]+))+}}/g;

  const queries: SimilarToQuery[] = [];
  for (const match of template.matchAll(regExp)) {
    const fullMatch = match[0];

    const searchForMatch = fullMatch.match(/search_for=([^}\s]+)/);
    const idMatch = fullMatch.match(/id=([^}\s]+)/);
    const category1Match = fullMatch.match(/category1=([^}\s]+)/);
    const category2Match = fullMatch.match(/category2=([^}\s]+)/);
    const category3Match = fullMatch.match(/category3=([^}\s]+)/);
    const namesMatch = fullMatch.match(/name=([^}\s]+)/);
    const countMatch = fullMatch.match(/count=(\d+)/);
    const beforeMatch = fullMatch.match(/before=(\d+)/);
    const afterMatch = fullMatch.match(/after=(\d+)/);

    if (!searchForMatch) {
      log.error(`No search_for query was found in the template: ${template}`);
      continue;
    }

    queries.push({
      fullMatch,
      id: idMatch?.[1]?.split(","),
      category1: category1Match?.[1]?.split(","),
      category2: category2Match?.[1]?.split(","),
      category3: category3Match?.[1]?.split(","),
      names: namesMatch?.[1]?.split(","),
      searchFor: searchForMatch[1].split(","),
      count: countMatch ? parseInt(countMatch[1]) : undefined,
      before: beforeMatch ? parseInt(beforeMatch[1]) : undefined,
      after: afterMatch ? parseInt(afterMatch[1]) : undefined,
    });
  }
  return queries;
};

interface FileQuery {
  fullMatch: string;
  id: string;
  fileSource: FileSourceType;
  bucket: string;
}

/**
 * Helper to parse all file queries in a template.
 * Finds: {{#file id=a source=db|local bucket=a}}
 * Unit-Tested: Yes
 */
export const parseFileQueries = (template: string): FileQuery[] => {
  const regExp =
    /{{#file(?:\s+(?:id|source|bucket|comment)=(?:"[^"]*"|[^}\s]+))+}}/g;
  const matches = [...template.matchAll(regExp)];

  return matches.map((match) => {
    const fullMatch = match[0];
    const idMatch = fullMatch.match(/id=([^\s}]+)/);
    const sourceMatch = fullMatch.match(/source=(db|local)/);
    const bucketMatch = fullMatch.match(/bucket=([^\s}]+)/);

    const result: FileQuery = {
      fullMatch,
      id: idMatch?.[1] ?? "",
      fileSource: (sourceMatch?.[1] || "db") as FileSourceType,
      bucket: bucketMatch?.[1] ?? "default",
    };

    // Only add bucket if it's specified
    if (bucketMatch?.[1]) {
      result.bucket = bucketMatch[1];
    }

    return result;
  });
};

/**
 * Helper to replace a dict of placeholders with values in a template.
 * Unit-Tested: Yes
 */
export const replacePlaceholders = async (
  template: string,
  placeholders: PlaceholderData,
  whitelist?: string[]
) => {
  let updatedPrompt = template;
  for (const [key, value] of Object.entries(placeholders)) {
    if (!whitelist || whitelist.includes(key)) {
      const exp = new RegExp(`{{${key}}}`, "g");
      const matches = updatedPrompt.match(exp);
      if (matches) {
        await log.debug(
          `Replace key: ${key} Value: ${shortenString(value, 50)}`
        );
        updatedPrompt = updatedPrompt.replaceAll(exp, value?.toString() || "");
      }
    }
  }
  return updatedPrompt;
};

/**
 * Helper to replace placeholders in a list of messages.
 */
const replacePlaceholdersInMessages = async (
  messages: Message[],
  placeholders: PlaceholderData
) => {
  // all messages will be mutated in place
  for (const message of messages) {
    message.content = await replacePlaceholders(
      message.content.toString(),
      placeholders
    );

    // parse all knowledgebase queries
    const knowledgebaseQueries = parseKnowledgebaseQueries(message.content);
    for (const query of knowledgebaseQueries) {
      log.debug(`Knowledgebase query: ${JSON.stringify(query)}`);
      const knowledgebaseEntry = await getPlainKnowledge(query);
      // replace the full match with the knowledgebase entry
      const text = knowledgebaseEntry.map((e) => e.text).join("\n\n");
      message.content = message.content.replace(query.fullMatch, text);
    }

    // parse all similar_to queries
    const similarToQueries = parseSimilarToQueries(message.content);
    for (const query of similarToQueries) {
      if (!query.searchFor) {
        continue;
      }
      log.debug(`Similar to query: ${JSON.stringify(query)}`);
      for (const searchFor of query.searchFor) {
        const similarToEntries = await getNearestEmbeddings({
          searchText: searchFor,
          n: 5,
          addBeforeN: 0,
          addAfterN: 0,
          filterCategory1: query.category1,
          filterCategory2: query.category2,
          filterCategory3: query.category3,
          filterName: query.names,
        });
        const text = similarToEntries.map((e) => e.text).join("\n\n");
        message.content = message.content.replace(query.fullMatch, text);
      }
    }

    // parse all file queries
    const fileQueries = parseFileQueries(message.content);
    for (const query of fileQueries) {
      try {
        if (
          query.fileSource !== FileSourceType.DB &&
          query.fileSource !== FileSourceType.LOCAL
        ) {
          throw new Error(`Invalid file source type: ${query.fileSource}`);
        }
        const parsedFile = await parseDocument({
          fileSourceType: query.fileSource,
          fileSourceId: query.id,
          fileSourceBucket: query.bucket,
        });
        message.content = message.content.replace(
          query.fullMatch,
          parsedFile.content
        );
      } catch (e) {
        log.error(
          `Error getting file ${query.id} from ${query.fileSource}: ${e}`
        );
      }
    }
  }
};

/**
 * Helper to parse a role string.
 * Will return "system", "user"(default) or "assistant".
 */
const parseRole = (str: string) => {
  if (str === "system" || str === "user" || str === "assistant") {
    return str;
  }
  return "user";
};

/**
 * Helper to parse a boolean given as string.
 * Ensures that the value is a boolean.
 */
const parseBoolean = (str: string | undefined) => {
  if (str && (str === "true" || str === "1")) {
    return true;
  }
  return false;
};

/**
 * Helper to parse output_type
 * Possible returns = text | json
 * Ensures that the value is a valid output type.
 */
const parseOutputType = (str: string | undefined) => {
  if (str && str === "json") {
    return "json";
  }
  return "text";
};

/**
 * Helper to generate a message object
 * Uses as a factory to create a message object with the correct role and content.
 * Unit-Tested: Yes
 */
export const generateMessage = async (
  role: string,
  content: string,
  whitelist: string[],
  usersData: PlaceholderData,
  defaultData: PlaceholderData
): Promise<Message> => {
  let text = content.trim();
  text = await replacePlaceholders(
    text,
    { ...defaultData, ...usersData },
    whitelist
  );

  return { role: parseRole(role), content: text };
};

type BlockVariables = {
  outputVarName: string;
  forget: boolean;
  outputType: "text" | "json";
};

/**
 * Helper to parse block variables to an object
 * Unit-Tested: Nested
 */
const parseBlockVariables = (str: string): BlockVariables => {
  // Match all possible arguments regardless of order
  const matches = str.match(
    /{{#break(?: (?:output=(\w+)|forget=(true)|output_type=(\w+)))*}}/
  );
  if (!matches)
    return { outputVarName: "output", forget: false, outputType: "text" };

  // Find individual arguments using separate regex matches
  const outputMatch = str.match(/output=(\w+)/);
  const forgetMatch = str.match(/forget=(true)/);
  const outputTypeMatch = str.match(/output_type=(\w+)/);

  return {
    outputVarName: outputMatch?.[1] || "output",
    forget: forgetMatch !== null,
    outputType: parseOutputType(outputTypeMatch?.[1]) || "text",
  };
};

/**
 * Helper to get all blocks from a template
 * This will parse the template and split it into blocks by the {{#break ...}} keyword.
 * It will return an array of blocks. Each block is an object with the template and block definition.
 * Unit-Tested: Yes
 */
export const getBlocksFromTemplate = (template: string): RawBlock[] => {
  const rawBlocks: RawBlock[] = [];
  const usedVarNames = new Set<string>();

  // Simpler regex that just matches the break block without capturing variables
  const breakBlockRegex = /{{#break[^}]*}}/g;
  let match;
  let lastIndex = 0;

  while ((match = breakBlockRegex.exec(template)) !== null) {
    // Get the template content before this break
    const blockTemplate = template.slice(lastIndex, match.index);

    // Parse the break block variables
    const blockVars = parseBlockVariables(match[0]);

    // Check for duplicate variable names
    if (usedVarNames.has(blockVars.outputVarName)) {
      throw new Error(
        `Duplicate output variable name ${blockVars.outputVarName} was found in Template.`
      );
    }
    usedVarNames.add(blockVars.outputVarName);

    rawBlocks.push({
      template: blockTemplate,
      ...blockVars,
    });

    lastIndex = breakBlockRegex.lastIndex;
  }

  // Handle the remaining content after the last break
  if (lastIndex < template.length) {
    const blockTemplate = template.slice(lastIndex);
    rawBlocks.push({
      template: blockTemplate,
      outputVarName: "output",
      forget: false,
      outputType: "text",
    });
  }

  // If no breaks found, use entire template as one block
  if (rawBlocks.length === 0) {
    rawBlocks.push({
      template,
      outputVarName: "output",
      forget: false,
      outputType: "text",
    });
  }

  return rawBlocks;
};

/**
 * Helper to generate an array of message blocks from a list of raw blocks.
 * This will split the raw blocks into message blocks by the {{#role=...}} keyword.
 * It will generate the messages for each block and return an array of message blocks.
 */
const generateMessageBlocksFromRawBlocks = async (
  rawBlocks: RawBlock[],
  whitelist: string[],
  usersData: PlaceholderData,
  defaultData: PlaceholderData
): Promise<MessageBlock[]> => {
  // Regular expressions to match role blocks and placeholders
  const roleBlockRegex = /{{#role=(\w+)}}([\s\S]*?){{\/role}}/g;
  const blocks: MessageBlock[] = [];

  // Iterate over all blocks in the template
  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const messages: Message[] = [];
    let match = undefined;
    while ((match = roleBlockRegex.exec(block.template)) !== null) {
      messages.push(
        await generateMessage(
          match[1],
          match[2],
          whitelist,
          usersData,
          defaultData
        )
      );
    }

    if (messages.length === 0) {
      messages.push(
        await generateMessage(
          "user",
          block.template,
          whitelist,
          usersData,
          defaultData
        )
      );
    }
    blocks.push({
      messages,
      outputVarName: block.outputVarName,
      forget: block.forget,
      outputType: block.outputType,
    });
  }
  return blocks;
};

/**
 * Helper for debugging to print a list of messages in a more readable format.
 */
const printMessages = async (data: Message[]) => {
  for (const message of data) {
    await log.debug(
      `[${message.role}]: ${shortenString(message.content + "", 100)}`
    );
  }
};

/**
 * Helper to generate an array of message blocks from a raw template text.
 * This function parses the template and extracts all message parts given by the dialog blocks in the template.
 * It returns an array of message blocks and its return variable name.
 */
const generateMessageBlocks = async (
  template: string,
  placeholderList: string[],
  usersData: PlaceholderData,
  defaultData: PlaceholderData
): Promise<MessageBlock[]> => {
  // First split the template into blocks by the break blocks.
  const rawBlocks = getBlocksFromTemplate(template);

  // Then extract the dialog from the blocks
  const messageBlocks = await generateMessageBlocksFromRawBlocks(
    rawBlocks,
    placeholderList,
    usersData,
    defaultData
  );

  return messageBlocks;
};

/**
 * Helper to get the definition of a prompt template
 */
export const getPromptTemplateDefinition = async (
  data: {
    promptId?: string;
    promptName?: string;
    promptCategory?: string;
  },
  returnHiddenEntries = true
) => {
  if (data.promptId) {
    return await getPromptTemplateById(data.promptId, returnHiddenEntries);
  } else if (data.promptName && data.promptCategory) {
    return await getPromptTemplateByNameAndCategory(
      data.promptName,
      data.promptCategory,
      returnHiddenEntries
    );
  }
  throw new Error(
    "Either promptId or promptName and promptCategory have to be set."
  );
};

/**
 * Generate a dialog by a prompt template.
 */
export const getDialogByTemplate = async (request: GenerateByTemplateInput) => {
  // get the prompt template from the database
  const definition = await getPromptTemplateDefinition(request);

  // get all requrired fields that has to be provided by the user
  const requiredFields = definition.promptTemplatePlaceholders
    .filter((p) => p.requiredByUser)
    .map((p) => p.name);

  // check the payload for required fields
  const usersPlaceholders = request.usersPlaceholders ?? {};
  for (const key of requiredFields) {
    if (!(key in usersPlaceholders)) {
      throw new Error(
        `The field ${key} is required by the prompt template but was not provided.`
      );
    }
  }

  // get all needed placeholders from db config
  const placeholderKeys = definition.promptTemplatePlaceholders.map(
    (p) => p.name
  );
  const defaultValues = definition.promptTemplatePlaceholders
    .map((p) => ({
      [p.name]: p.defaultValue,
    }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const rawDialog = await generateMessageBlocks(
    definition.template,
    placeholderKeys,
    usersPlaceholders,
    defaultValues
  );

  return rawDialog;
};

/**
 * Wrapper to iterate over message blocks and generate a response
 */
const generateResponseFromMessageBlocks = async (
  messageBlocks: MessageBlock[]
) => {
  let allResponses: Record<string, string> = {};

  let allMessages: Message[] = [];
  let lastOutputVarName = "output";
  let lastAiResponse: { text: string; json?: any } | undefined;

  log.debug(`Generating response from ${messageBlocks.length} blocks.`);

  // iterate over all message blocks
  // the messages will be extended by the assistant response after each block
  // OR it will be reset by the forget flag
  for (let i = 0; i < messageBlocks.length; i++) {
    const block = messageBlocks[i];

    // replace the placeholders in the messages from previous blocks
    const updatedMessages = await replacePlaceholdersInMessages(
      block.messages,
      allResponses
    );

    if (!block.forget) {
      allMessages = [...allMessages, ...block.messages];
    } else {
      // reset the message list if the forget flag is set
      await log.debug("Resetting the message list because of forget flag.");
      allMessages = [];
    }

    await log.debug(
      `Block ${i + 1}, Type: ${block.outputType}, OutputVarName: ${block.outputVarName}`
    );
    await printMessages(allMessages);

    const outputVarName = block.outputVarName;
    const assistantResponse = await generateLongText(
      allMessages,
      block.outputType
    );

    allResponses[outputVarName] = assistantResponse.text;
    lastAiResponse = assistantResponse;
    lastOutputVarName = outputVarName;

    // add the assistant response to the message list
    allMessages.push({ role: "assistant", content: assistantResponse.text });
  }
  return {
    messages: allMessages,
    responses: allResponses,
    lastOutputVarName,
    jsonResponse: lastAiResponse?.json,
  };
};

/**
 * Generate a response using a prompt template.
 * The template uses optional placeholders like {{userInput}}.
 * The placeholders are replaced with the provided values or with default values if not provided.
 * The default values can be configured in the database and are optional.
 */
export const textGenerationByPromptTemplate = async (
  data: GenerateByTemplateInput
) => {
  const dialog = await getDialogByTemplate(data);
  const response = await generateResponseFromMessageBlocks(dialog);

  return response;
};
