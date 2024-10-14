/**and,
 * A library to generate texts or answers using a prompt template.
 * The prompt template is defined in the database and can be used to generate texts for different purposes.
 * A prompt template is a text with placeholders. The placeholders are replaced with values from the database or from the user.
 * A template can also contain multiple dialogs with different roles. These dialogs are executed sequencially to reach a complex generation result.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "src/lib/db/db-connection";
import { promptTemplates } from "src/lib/db/db-schema";
import { generateLongText, type Message } from "../standard/openai";
import log from "src/lib/log";
import type { GenerateByTemplateInput } from "src/routes/ai";

type PlaceholderData = Record<
  string,
  string | number | boolean | null | undefined
>;

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
{{/role}}

{{#break output=someVariableNameTwo}}

{{#role=assistant}}
...{{someVariableNameTwo}}...
{{/role}}

{{#break}}

Jeder BREAK-Block kann optional einen Output-Variablen-Namen haben.
Wird dieser nicht angegeben, wird der Output in die Variable "output" geschrieben.

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
 * Get a prompt template from the database by id.
 */
const getPromptTemplateById = async (promptId: string) => {
  const result = await getDb().query.promptTemplates.findFirst({
    where: eq(promptTemplates.id, promptId),
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
 * Get a prompt template from the database by name and category.
 */
const getPromptTemplateByNameAndCategory = async (
  promptName: string,
  promptCategory: string
) => {
  const result = await getDb().query.promptTemplates.findFirst({
    where: and(
      eq(promptTemplates.name, promptName),
      eq(promptTemplates.category, promptCategory)
    ),
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
 * Helper to replace a dict of placeholders with values in a template.
 */
const replacePlaceholders = async (
  template: string,
  placeholders: PlaceholderData,
  whiteList: string[]
) => {
  let updatedPrompt = template;
  for (const [key, value] of Object.entries(placeholders)) {
    if (whiteList.includes(key)) {
      await log.debug(`Replace key: ${key} Value: ${value}`);
      updatedPrompt = updatedPrompt.replaceAll(
        `{{${key}}}`,
        value?.toString() || ""
      );
    }
  }
  return updatedPrompt;
};

/**
 * Parse a role string.
 * Will return "system", "user"(default) or "assistant".
 */
const parseRole = (str: string) => {
  if (str === "system" || str === "user" || str === "assistant") {
    return str;
  }
  return "user";
};

/**
 * Generate a message
 */
export const generateMessage = async (
  role: string,
  content: string,
  whiteList: string[],
  usersData: PlaceholderData,
  defaultData: PlaceholderData
): Promise<Message> => {
  let text = content.trim();
  text = await replacePlaceholders(
    text,
    { ...defaultData, ...usersData },
    whiteList
  );

  return { role: parseRole(role), content: text };
};

/**
 * Get all blocks from a template
 * This will parse the template and split it into blocks by the {{#break output?=varName}} keyword.
 * It will return an array of blocks. Each block is an object with the template and the output variable name.
 */
const getBlocksFromTemplate = (
  template: string
): { template: string; outputVarName: string }[] => {
  const rawBlocks: { template: string; outputVarName: string }[] = [];
  const usedVarNames = new Set<string>();

  const breakBlockRegex = /{{#break(?: output=(\w+))?}}/g;
  let match;
  let lastIndex = 0;

  while ((match = breakBlockRegex.exec(template)) !== null) {
    const outputVarName = match[1] || "output";
    if (usedVarNames.has(outputVarName)) {
      throw new Error(
        `Duplicate output variable name ${outputVarName} was found in Template.`
      );
    }
    usedVarNames.add(outputVarName);

    const blockTemplate = template.slice(lastIndex, match.index);
    rawBlocks.push({ template: blockTemplate, outputVarName });

    lastIndex = breakBlockRegex.lastIndex;
  }

  // Handle the last block after the final break statement
  if (lastIndex < template.length) {
    const outputVarName = "output";
    if (usedVarNames.has(outputVarName)) {
      throw new Error(
        `Duplicate output variable name ${outputVarName} was found in Template.`
      );
    }
    usedVarNames.add(outputVarName);
    const blockTemplate = template.slice(lastIndex);
    rawBlocks.push({ template: blockTemplate, outputVarName });
  }

  // If no break statements were found, use the entire template as one block
  if (rawBlocks.length === 0) {
    const outputVarName = "output";
    rawBlocks.push({ template, outputVarName });
  }

  return rawBlocks;
};

/**
 * Generate an array of message blocks from a list of raw blocks.
 * This will split the raw blocks into message blocks by the {{#role=...}} keyword.
 * It will generate the messages for each block and return an array of message blocks.
 */
const generateMessageBlocksFromRawBlocks = async (
  rawBlocks: { template: string; outputVarName: string }[],
  whiteList: string[],
  usersData: PlaceholderData,
  defaultData: PlaceholderData
): Promise<{ messages: Message[]; outputVarName: string }[]> => {
  // Regular expressions to match role blocks and placeholders
  const roleBlockRegex = /{{#role=(\w+)}}([\s\S]*?){{\/role}}/g;
  const blocks: { messages: Message[]; outputVarName: string }[] = [];

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
          whiteList,
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
          whiteList,
          usersData,
          defaultData
        )
      );
    }
    blocks.push({ messages, outputVarName: block.outputVarName });
  }
  return blocks;
};

/**
 * Debugging helper to print a list of messages
 */
const printMessages = async (
  data: { messages: Message[]; outputVarName: string }[]
) => {
  for (let i = 0; i < data.length; i++) {
    const block = data[i];
    for (const message of block.messages) {
      await log.debug(
        `[Block ${i}, output=${block.outputVarName}] ${message.role}: \n${message.content}`
      );
    }
  }
};

/**
 * Generate an array of message blocks from a raw template text.
 * This function parses the template and extracts all message parts given by the dialog blocks in the template.
 * It returns an array of message blocks and its return variable name.
 */
const generateMessageBlocks = async (
  template: string,
  placeholderList: string[],
  usersData: PlaceholderData,
  defaultData: PlaceholderData
): Promise<{ messages: Message[]; outputVarName: string }[]> => {
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
 * Generate a dialog by a prompt template.
 */
export const getDialogByTemplate = async (data: GenerateByTemplateInput) => {
  // get the prompt template from the database
  let defintion;
  if (data.promptId) {
    defintion = await getPromptTemplateById(data.promptId);
  } else if (data.promptName && data.promptCategory) {
    defintion = await getPromptTemplateByNameAndCategory(
      data.promptName,
      data.promptCategory
    );
  } else {
    throw new Error(
      "Either promptId or promptName and promptCategory have to be set."
    );
  }

  // get all requrired fields that has to be provided by the user
  const requiredFields = defintion.promptTemplatePlaceholders
    .filter((p) => p.requiredByUser)
    .map((p) => p.name);

  // check the payload for required fields
  const usersPlaceholders = data.usersPlaceholders ?? {};
  for (const key of requiredFields) {
    if (!(key in usersPlaceholders)) {
      throw new Error(
        `The field ${key} is required by the prompt template but was not provided.`
      );
    }
  }

  // get all needed placeholders from db config
  const placeholderKeys = defintion.promptTemplatePlaceholders.map(
    (p) => p.name
  );
  const defaultValues = defintion.promptTemplatePlaceholders
    .map((p) => ({
      [p.name]: p.defaultValue,
    }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const rawDialog = await generateMessageBlocks(
    defintion.template,
    placeholderKeys,
    usersPlaceholders,
    defaultValues
  );
  await printMessages(rawDialog);

  return rawDialog;
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
  // const response = await generateLongText(dialog);
  return dialog;
};
