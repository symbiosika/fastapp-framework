import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  aiFunctionExecuter,
  getAllAiFunctionDescriptions,
  getUiDescriptionForFunctionCall,
} from "./function-calls";
import { FAST_TEXT_MODEL, openai, TEXT_MODEL } from "../standard/openai";
import { isContentAllowed } from "./content-filter";
import { classifyMessage } from "./message-classifier";
import { classifyFunctionMessage } from "./function-classifier";

const systemPrompt = `
You are an AI assistant integrated into a web application backend.
You have access to functions that can add, list, and modify data.

When a user asks to perform an action, determine the required function
and ensure all necessary parameters are provided.
If parameters are missing, politely ask the user to provide them.
Your responses should be clear, professional, and helpful.
`;

/**
 * A small in memory chat history for the function chat.
 */
const globalChatHistory = new Map<string, ChatCompletionMessageParam[]>();

/**
 * Generate a random id for the chat session
 */
const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const functionChat = async (
  chatId: string | undefined,
  messages: ChatCompletionMessageParam[]
) => {
  try {
    // Generate a new chatId if none is provided
    if (!chatId) {
      console.log("No chatId provided, generating new chatId");
      chatId = generateId();
      globalChatHistory.set(chatId, [
        {
          role: "system",
          content: systemPrompt,
        },
      ]);
    }

    // Check if message is allowed
    const lastUserMessage = messages[messages.length - 1].content as string;
    const isAllowed = true; //await isContentAllowed(lastUserMessage);

    if (!isAllowed) {
      console.log("Content not allowed");
      return {
        chatId,
        reply: "I´m sorry, but I can´t answer that question.",
      };
    }

    // Classify the message
    const messageType = await classifyMessage(lastUserMessage);

    // Handle knowledge messages
    if (messageType === "knowledge") {
      return {
        chatId,
        reply: "Knowledge questions are not implemented yet.",
      };
    }

    // Get the chat history for the chatId, or an empty array if no chatId is provided
    const chatHistory = globalChatHistory.get(chatId) ?? [];
    console.log("Found chat history?", chatHistory.length);
    const fullMessages = [...chatHistory, ...messages];

    console.log("fullMessages", fullMessages);

    const functionClassification =
      await classifyFunctionMessage(lastUserMessage);
    console.log("functionClassification", functionClassification);

    if (functionClassification.allFieldsAreSet) {
      const functionCall = {
        name: functionClassification.functionName,
        arguments: functionClassification.knownFields,
      };
      console.log("functionCall", functionCall);
      const functionResponse = await aiFunctionExecuter(
        functionCall.name,
        functionClassification.knownFields
      );
      console.log("functionResponse", functionResponse);
    }

    return {
      chatId,
      reply: "",
    };


    /* const response = await openai.chat.completions.create({
      model: FAST_TEXT_MODEL,
      messages: fullMessages,
      tools: getAllAiFunctionDescriptions(),
      tool_choice: "auto",
    });
    console.log("AI response", response);
    const assistantMessage = response.choices[0].message; */

    /* if (
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

      globalChatHistory.set(chatId, [...fullMessages, finalMessage]);
      return {
        chatId,
        reply: finalMessage.content,
        uiResponse,
      };
    } else {
      // No function call, just return the assistant's message
      console.log("No function call detected");

      globalChatHistory.set(chatId, [...fullMessages, assistantMessage]);
      return {
        chatId,
        reply: assistantMessage.content,
      };
    } */
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return {
      chatId,
      reply: "An error occurred while processing your request.",
    };
  }
};
