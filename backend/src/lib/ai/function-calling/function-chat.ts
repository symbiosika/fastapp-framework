import OpenAIClient from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  aiFunctionExecuter,
  getAllAiFunctionDescriptions,
  getUiDescriptionForFunctionCall,
} from ".";

const TEXT_MODEL = "gpt-4-turbo";
const systemPrompt = `
You are an AI assistant integrated into a web application backend. You have access to functions that can add, list, and modify data. When a user asks to perform an action, determine the required function and ensure all necessary parameters are provided. If parameters are missing, politely ask the user to provide them. Your responses should be clear, professional, and helpful.
`;

const openai = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

const globalChatHistory = new Map<string, ChatCompletionMessageParam[]>();

export const functionChat = async (
  chatId: string | undefined,
  messages: ChatCompletionMessageParam[]
) => {
  try {
    if (!chatId) {
      chatId = generateId();
      globalChatHistory.set(chatId, [
        {
          role: "system",
          content: systemPrompt,
        },
      ]);
    }
    // Get the chat history for the chatId, or an empty array if no chatId is provided
    const chatHistory = globalChatHistory.get(chatId) ?? [];
    const fullMessages = [...chatHistory, ...messages];
    // console.log(fullMessages);

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: fullMessages,
      tools: getAllAiFunctionDescriptions(),
      tool_choice: "auto",
    });

    // console.log(response);
    const assistantMessage = response.choices[0].message;

    if (
      response.choices[0].finish_reason === "tool_calls" &&
      response.choices[0]?.message.tool_calls
    ) {
      console.log("Function call detected");

      const toolCall = response.choices[0]?.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      // Handle the function call
      if (!toolCall.function.name || !args) {
        throw new Error(
          "Function call detected but no function name or arguments found"
        );
      }

      const functionResponse = await aiFunctionExecuter(
        toolCall.function.name,
        args
      );

      const uiResponse = getUiDescriptionForFunctionCall(
        toolCall.function.name
      );

      // Append the function response to the conversation
      messages.push(assistantMessage);
      messages.push({
        role: "tool",
        tool_call_id: response.choices[0].message.tool_calls[0].id,
        content: JSON.stringify(functionResponse),
      });

      // Get the assistant's final reply
      const finalResponse = await openai.chat.completions.create({
        model: TEXT_MODEL,
        messages,
      });

      const finalMessage = finalResponse.choices[0].message;

      return {
        chatId,
        reply: finalMessage.content,
        uiResponse,
      };
    } else {
      // No function call, just return the assistant's message
      console.log("No function call detected");
      return {
        chatId,
        reply: assistantMessage.content,
      };
    }
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return {
      chatId,
      reply: "An error occurred while processing your request.",
    };
  }
};
