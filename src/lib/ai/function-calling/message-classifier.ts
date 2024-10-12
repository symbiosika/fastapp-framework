// backend/src/lib/ai/messageClassifier.ts

import { FAST_TEXT_MODEL, openai } from "../standard/openai";

const systemPrompt = `
You are a message classification assistant.

Classify the user's message into one of two categories:

"function": The user wants to perform an action.
"knowledge": The user is asking a knowledge question to get help about the app or a specific task.
Respond with only one word: "function" or "knowledge" (in English), regardless of the input language. Do not provide any additional text.

Steps
Analyze the user's message.
Determine whether the user is asking for help or trying to perform an action.
Respond with only the category: "function" or "knowledge."
Output Format
Respond with a single word: "function" or "knowledge." No additional information is required.

Examples
User: "Add a new event to my calendar."
Assistant: function

User: "How do I reset my password?"
Assistant: knowledge

User: "Delete all my data."
Assistant: function

User: "What features does this app have?"
Assistant: knowledge

User: "Starte ein neues Projekt."
Assistant: function

User: "Wie kann ich neue Daten eintragen?"
Assistant: knowledge
`;

export const classifyMessage = async (
  message: string
): Promise<"function" | "knowledge"> => {
  console.log("classifyMessage", message);
  const response = await openai.chat.completions.create({
    model: FAST_TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: message },
    ],
    max_tokens: 1,
    temperature: 0,
  });

  const classification = response?.choices[0]?.message?.content
    ?.trim()
    .toLowerCase();
  return classification === "function" ? "function" : "knowledge";
};
