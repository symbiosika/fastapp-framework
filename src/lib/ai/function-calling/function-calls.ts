import type { ChatCompletionTool } from "openai/resources/chat/completions";
import addProduct from "./add-product";

// --- SHARED TYPES WITH FRONTEND ---
export type FunctionCallingAction = (args: Record<string, any>) => Promise<any>;

type UiActionTextBlock = {
  type: "render_text";
  content: string;
};

export type FunctionCallingResponseUiAction = UiActionTextBlock;

export interface FunctionCalling {
  functionDescription: ChatCompletionTool;
  action: FunctionCallingAction;
  uiResponse: FunctionCallingResponseUiAction;
}

// ! -------------------------------

/**
 * The list of all function calling actions that the AI can perform.
 */
export const aiFunctions: FunctionCalling[] = [addProduct];

/**
 * Get all AI callable functions with descriptions for the chat
 */
export const getAllAiFunctionDescriptions = () => {
  return aiFunctions.map((func) => func.functionDescription);
};

/**
 * Execute a function call
 */
export const aiFunctionExecuter = async (
  functionName: string,
  args: Record<string, any>
) => {
  const func = aiFunctions.find(
    (func) => func.functionDescription.function.name === functionName
  );
  if (!func) {
    throw new Error(`Function ${functionName} not found`);
  }

  return func.action(args);
};

/*
 * Get the ui response for a function call.
 */
export const getUiDescriptionForFunctionCall = (functionName: string) => {
  const func = aiFunctions.find(
    (func) => func.functionDescription.function.name === functionName
  );
  if (!func) {
    throw new Error(`Function ${functionName} not found`);
  }
  return func.uiResponse;
};
