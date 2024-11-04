import {
  standardPlaceholderParsers,
  standardSingleLineParsers,
  TemplateChat,
  type LlmWrapper,
  type Message,
  type TemplateChatLogger,
} from "magic-prompt";
import { generateLongText } from "../standard";
import log from "src/lib/log";

/**
 * Wrapper function for generateLongText that matches the LlmWrapper type signature
 */
export const generateLongTextWrapper: LlmWrapper = async (
  messages: Message[],
  maxTokens?: number
) => {
  const result = await generateLongText(messages as any);
  return result.text;
};

/**
 * Logger Wrapper for the template chat
 */
const templateLogger: TemplateChatLogger = {
  debug: async (...items: any[]) => await log.debug(...items),
  info: async (...items: any[]) =>
    await log.info(...items.map((item) => String(item))),
  error: async (...items: any[]) =>
    await log.error(...items.map((item) => String(item))),
};

export const templateChat = new TemplateChat({
  singleLineParsers: standardSingleLineParsers,
  placeholderParsers: standardPlaceholderParsers,
  llmWrapper: generateLongTextWrapper,
  logger: templateLogger,
  defaultTemplate: `{{#block
  name=main_loop
  allow_open_chat=true
}}
  {{#role=assistant}}
    You are a helpful assistant and will help the user with his questions.
    You will answer short and to the point. You will answer to everything.
    Your answer will be in the language of the user.
  {{/role}}

  {{#role=user}}
    {{user_input}}
  {{/role}}
{{/block}}`,
});
