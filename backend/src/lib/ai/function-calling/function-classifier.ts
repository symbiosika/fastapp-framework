// backend/src/lib/ai/messageClassifier.ts

import { FAST_TEXT_MODEL, openai } from "../standard/openai";
import { getAllAiFunctionDescriptions } from "./function-calls";

export const classifyFunctionMessage = async (
  message: string
): Promise<{
  functionName: string;
  allFieldsAreSet: boolean;
  knownFields: {
    [parameterName: string]: any;
  };
}> => {
  // Create a system prompt that instructs the assistant on how to extract function details
  const systemPrompt = `
You are a function extraction assistant.

From the user's message, identify the function that the user wants to execute from the list.

For the identified function, extract the parameters required.
If any parameters are missing, note them and return them in the JSON schema.

You will respond in JSON format with only one JSON object if there is no function call detected.

The response format is as follows:
{
  functionName: string,
  missingFields: string[],
  knownFields: { [parameterName: string]: string | number | null }
}

You will wisely choose between a string, number or null for the knownFields.
You will also check all required fields from the function description and return them in the missingFields array.
You will be very precise and accurate in checking the required fields.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    functions: [
      {
        name: "add_product",
        description: "Add a product to the database",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the item to add",
            },
            type: {
              type: "string",
              description:
                "The type of the item to add. Can be 'product' or 'feature'",
            },
            description: {
              type: "string",
              description: "The description of the item to add",
            },
            price: {
              type: "number",
              description: "The price of the item to add",
            },
          },
          required: ["name", "type", "description", "price"],
          additionalProperties: false,
        },
      },
    ],
    function_call: "none",
    messages: [
      {
        role: "system",
        content: systemPrompt.trim(),
      },
      { role: "user", content: message },
    ],
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
            /* knownFields: {
              type: "object",
              properties: {
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
            }, */
          },
        },
      },
    },
  });

  console.log("response", response);
  const content = response?.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(
      "Something went wrong pre-parsing the function call. Couly not parse AI response."
    );
  }

  // Parse the JSON response
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse or validate response:", content);
    throw new Error("Something went wrong pre-parsing the function call.");
  }
};
