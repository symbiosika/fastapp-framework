import log from "src/lib/log";
import { openai } from "../standard/openai";
import { getAllAiFunctionDescriptions } from "./function-calls";
import * as v from "valibot";
import { getFunctionClassifierSystemPrompt } from "./function-classifier-system-prompt";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const valSchema = v.object({
  functionName: v.string(),
  missingFields: v.array(v.string()),
  knownFields: v.record(
    v.string(),
    v.union([v.string(), v.number(), v.null(), v.undefined()])
  ),
});

export const classifyFunctionMessage = async (
  messages: ChatCompletionMessageParam[]
): Promise<{
  data: {
    functionName: string;
    missingFields: string[];
    knownFields: {
      [parameterName: string]: any;
    };
  };
  messages: ChatCompletionMessageParam[];
}> => {
  // Create a system prompt that instructs the assistant on how to extract function details
  const systemPrompt = getFunctionClassifierSystemPrompt();

  await log.debug("messages.length", messages.length + "");

  // send the system prompt only if it is the first users message
  // length 2 meand ONE system prompt and ONE user prompt until now
  const messagesToSend: ChatCompletionMessageParam[] =
    messages.length === 1
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

  await log.logAChat("FUNCTION_CLASSIFIER", ...messagesToSend);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    functions: getAllAiFunctionDescriptions(),
    function_call: "none",
    messages: messagesToSend,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "function_call",
        schema: {
          type: "object",
          properties: {
            functionName: {
              type: "string",
            },
            missingFields: {
              type: "array",
              items: {
                type: "string",
              },
            },
            knownFields: {
              type: "object",
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "number",
                },
                {
                  type: "null",
                },
              ],
            },
          },
        },
      },
    },
  });
  const content = response?.choices[0]?.message?.content?.trim();
  if (!content) {
    log.debug(
      "Something went wrong pre-parsing the function call. Couly not parse AI response.",
      "System prompt",
      systemPrompt,
      "User message",
      messages[0].content?.toString() ?? "No user message found",
      "AI response",
      JSON.stringify(response)
    );
    throw new Error(
      "Something went wrong pre-parsing the function call. Couly not parse AI response."
    );
  }
  // parse and return valid JSON
  try {
    const parsed = JSON.parse(content);
    console.log("parsed", parsed);

    const result = v.safeParse(valSchema, parsed);
    if (!result.success) {
      log.error(
        "Something went wrong parsing the function call parameters.",
        result.issues?.map((issue) => issue.message).join("\n") ??
          "No issues found"
      );
      throw new Error("Something went wrong pre-parsing the function call.");
    }
    return {
      data: result.output,
      messages: messagesToSend,
    };
  } catch (e) {
    console.error(e);
    log.error("Something went wrong pre-parsing the function call.", e + "");
    throw new Error("Something went wrong pre-parsing the function call.");
  }
};
