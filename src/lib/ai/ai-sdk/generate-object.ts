import {
  type CoreMessage,
  generateObject,
  type LanguageModelV1,
  type Schema,
} from "ai";
import { log, type OrganisationContext } from "../../..";
import { getAIModel } from "./get-model";
import { nanoid } from "nanoid";
import type { SourceReturn } from "./types";

/*
How to define a schema for the output of the AI:

const demoSchema = jsonSchema<{
  demo: {
    name: string;
    age: number;
    email: string;
  };
}>({
  type: "object",
  properties: {
    demo: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
      required: ["name", "age", "email"],
    },
  },
});
*/

/**
 * ChatCompletion function to generate a response for the given prompt.
 * Will respond with plain Text only.
 */
export async function chatCompletionWithObjectOutput(
  messages: CoreMessage[],
  context: OrganisationContext,
  options: {
    providerAndModelName?: string;
    temperature?: number;
    maxTokens?: number;
    schema: Schema;
  }
) {
  let providerAndModelName = options?.providerAndModelName;
  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_CHAT_COMPLETION_MODEL ?? "openai:gpt-4o-mini";
  }

  const model = await getAIModel(providerAndModelName, context);

  // Use generateText with maxSteps for automatic tool handling
  const { object, usage } = await generateObject({
    model: model as LanguageModelV1,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    schema: options.schema,
  });

  const text = JSON.stringify(object, null, 2);

  // Log final completion
  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.userId,
    source: "ai",
    category: "text-generation",
    message: "text-generation-complete",
    metadata: {
      model: providerAndModelName,
      responseLength: text.length,
      usedTokens: usage?.totalTokens,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
    },
  });

  const sources: SourceReturn[] = [];

  return {
    id: nanoid(6),
    text,
    object,
    model: providerAndModelName,
    meta: {
      responseLength: text.length,
      usedTokens: usage?.totalTokens,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      sources: sources,
    },
  };
}
