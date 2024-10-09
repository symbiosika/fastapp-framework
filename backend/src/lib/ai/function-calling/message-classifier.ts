// backend/src/lib/ai/messageClassifier.ts

import { FAST_TEXT_MODEL, openai } from "../standard/openai";

export const classifyMessage = async (
  message: string
): Promise<"function" | "knowledge"> => {
  const response = await openai.chat.completions.create({
    model: FAST_TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: `
You are an assistant that classifies user messages into two categories:
- "function": The user wants to perform an action using the app's functions.
- "knowledge": The user is asking a general knowledge question.

Respond with only "function" or "knowledge".`,
      },
      { role: "user", content: message },
    ],
    max_tokens: 1,
    temperature: 0,
  });
  console.log(response?.choices[0]);

  const classification = response?.choices[0]?.message?.content?.trim();
  return classification === "function" ? "function" : "knowledge";
};
