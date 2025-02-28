import log from "../../log";
import { openaiClient } from "../standard";
import { getAllAiFunctionDescriptions } from "./function-calls";
import * as v from "valibot";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getAllAiFunctionQaExamples } from "./function-calls";

const systemPrompt = `
Identify the function the user intends to execute and extract the necessary parameters from the user’s input. If any required parameters are missing, list them clearly. Always return the result in JSON format.

# Steps

1. **Identify the Function**: Parse the user’s message and identify the relevant function from a predefined list.
2. **Extract Parameters**: From the user’s message, extract all known parameters for the identified function. Ensure that the parameter types (string, number, or null) are accurately inferred based on the provided input.
3. **Check for Missing Parameters**: Review the function’s definition for any required parameters that have not been supplied by the user. List these missing parameters explicitly.
4. **Output in JSON Format**: Return a single JSON object. If no function is detected, return an empty JSON object.

# Output Format

\`\`\`json
{
  "functionName": "string",
  "missingFields": ["string"],
  "knownFields": { 
    "parameterName": "string | number | null" 
  }
}
\`\`\`

- \`"functionName"\`: The identified function from the list. If no function is detected, return \`"unknown"\`.
- \`"missingFields"\`: An array of required fields that the user did not provide.
- \`"knownFields"\`: A dictionary with the known fields, mapping each parameter name to its value (or \`null\` if the field is missing or inferred).

# Example

### User Input:
“I want to create a new user, their name is John, and email is john@example.com.”

### Expected Output:
\`\`\`json
{
  "functionName": "createUser",
  "missingFields": ["password"],
  "knownFields": {
    "name": "John",
    "email": "john@example.com",
    "password": null
  }
}
\`\`\`

### User Input:
“I need to update the order 123 status to shipped.”

### Expected Output:
\`\`\`json
{
  "functionName": "updateOrderStatus",
  "missingFields": [],
  "knownFields": {
    "orderId": 123,
    "status": "shipped"
  }
}

### User Input:
“Please add a object called "U" in the table "Y".”

### Expected Output:
\`\`\`json
{
  "functionName": "unknown",
  "missingFields": [],
  "knownFields": {}
}
\`\`\`
`;

const getFunctionClassifierSystemPrompt = () => {
  const qAndA = getAllAiFunctionQaExamples();
  const examples = qAndA
    .map((qa) => {
      return `
### User Input:
${qa.q}

### Expected Output:
${qa.a}
`;
    })
    .join("\n");
  return systemPrompt + examples;
};

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

  // send the system prompt only if it is the first users message
  // length 2 meand ONE system prompt and ONE user prompt until now
  const messagesToSend: ChatCompletionMessageParam[] =
    messages.length === 1
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

  await log.logAChat("FUNCTION_CLASSIFIER", ...messagesToSend);

  const response = await openaiClient.chat.completions.create({
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
    log.error(
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
