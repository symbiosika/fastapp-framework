import { getDb } from "../../../lib/db/db-connection";
import {
  type KnowledgeEntrySelect,
  type LLMOptions,
  promptTemplates,
} from "../../../lib/db/db-schema";
import { eq, and } from "drizzle-orm";
import type { ChatArtifactDictionary, ChatMessageRole } from "./chat-store";
import type { ChatMessage } from "./chat-store";
import { nanoid } from "nanoid";
import { BaseAgent } from "../agents/types";
import {
  AgentDefinition,
  AgentInputSchema,
  AgentExecution,
} from "../agents/types";
import { LLMAgent } from "../agents/llm-agent";
import type { ChatSessionContext } from "../chat/chat-store";
import { AgentInputVariables } from "../../types/agents";

export type AgentSystemPrompt = {
  id: string;
  name: string;
  category: string;
  label: string;
  systemPrompt: string;
  userPrompt: string | null;
  llmOptions: LLMOptions;
  langCode: string | null;
  needsInitialCall: boolean;
  promptTemplatePlaceholders: {
    id: string;
    name: string;
    type: "image" | "text";
    label: string;
    requiredByUser: boolean;
    defaultValue: string | null;
  }[];
};

// HACK: bei den abfragen muss allgemein userId und orgId mit geprüft werden!

/**
 * Hepler to get a prompt template from the database by id.
 */
const getPromptTemplateById = async (
  id: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(eq(promptTemplates.hidden, false), eq(promptTemplates.id, id));
  } else {
    where = eq(promptTemplates.id, id);
  }
  const result = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      promptTemplatePlaceholders: true,
    },
  });
  if (!result) {
    throw new Error("Sorry. The prompt template was not found.");
  }
  return result;
};

/**
 * Helper to get a prompt template from the database by name and category.
 */
const getPromptTemplateByNameAndCategory = async (
  name: string,
  category: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(
      eq(promptTemplates.hidden, false),
      eq(promptTemplates.name, name),
      eq(promptTemplates.category, category)
    );
  } else {
    where = and(
      eq(promptTemplates.name, name),
      eq(promptTemplates.category, category)
    );
  }
  const result = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      promptTemplatePlaceholders: true,
    },
  });
  if (!result) {
    throw new Error("Sorry. The prompt template was not found.");
  }
  return result;
};

/**
 * Helper to get the definition of a prompt template
 */
export const getPromptTemplateDefinition = async (
  query: {
    id?: string;
    name?: string;
    category?: string;
  },
  returnHiddenEntries = true
) => {
  if (query.id) {
    return await getPromptTemplateById(query.id, returnHiddenEntries);
  } else if (query.name && query.category) {
    return await getPromptTemplateByNameAndCategory(
      query.name,
      query.category,
      returnHiddenEntries
    );
  }
  throw new Error("Either id or name and category have to be set.");
};

/**
 * Init Agent
 */
export const initAgentsSystemPrompt = async (
  userId: string,
  organisationId: string,
  query: {
    id?: string;
    name?: string;
    category?: string;
  }
): Promise<AgentSystemPrompt> => {
  const promptTemplate = await getPromptTemplateDefinition(query).catch(
    () => null
  );
  if (!promptTemplate) {
    const systemPrompt = `You are a highly knowledgeable assistant dedicated to solving a wide range of general tasks.
    For every user query, provide responses that are both comprehensive and easy to follow.
    Always format your answers using well-structured Markdown:
    include clear headings, bullet points, and code blocks where appropriate. Prioritize clarity, conciseness, and best practices, ensuring your responses are both professional and visually engaging.`;

    return {
      id: "",
      name: "",
      llmOptions: {},
      category: "",
      label: "",
      systemPrompt,
      userPrompt: null,
      langCode: null,
      needsInitialCall: false,
      promptTemplatePlaceholders: [],
    };
  } else
    return {
      id: promptTemplate.id,
      name: promptTemplate.name,
      category: promptTemplate.category,
      label: promptTemplate.label,
      systemPrompt: promptTemplate.systemPrompt,
      userPrompt: promptTemplate.userPrompt,
      langCode: promptTemplate.langCode,
      needsInitialCall: promptTemplate.needsInitialCall,
      promptTemplatePlaceholders: promptTemplate.promptTemplatePlaceholders.map(
        (placeholder) => ({
          id: placeholder.id,
          name: placeholder.name,
          type: placeholder.type,
          label: placeholder.label,
          requiredByUser: placeholder.requiredByUser,
          defaultValue: placeholder.defaultValue,
        })
      ),
      llmOptions: promptTemplate.llmOptions ?? {},
    };
};

/**
 * Init a chat message
 */
export const initChatMessage = (
  message: string,
  role: ChatMessageRole = "system",
  meta?: {
    provider?: string;
    model?: string;
    human?: boolean;
    timestamp?: string;
    documents?: {
      knowledgeEntries?: KnowledgeEntrySelect[];
    };
    thinkings?: string[];
    citations?: string[];
  },
  artifacts?: ChatArtifactDictionary
) => {
  const id = nanoid(16);
  const chatMessage: ChatMessage = {
    role: role,
    content: message,
    meta: { ...meta, id },
    artifacts,
  };
  return chatMessage;
};

/**
 * Get a database template as Agent instance by ID or name+category
 */
export const getAgent = async (
  context: {
    userId: string;
    organisationId: string;
  },
  query: {
    id?: string;
    name?: string;
    category?: string;
  }
): Promise<BaseAgent> => {
  const sysPrompt = await initAgentsSystemPrompt(
    context.userId,
    context.organisationId,
    query
  );

  /**
   * Create a dynamic agent class based on the system prompt
   */
  class DynamicAgent implements BaseAgent {
    private systemPrompt: AgentSystemPrompt;

    constructor(systemPrompt: AgentSystemPrompt) {
      this.systemPrompt = systemPrompt;
    }

    getDefinition(): AgentDefinition {
      return {
        id: this.systemPrompt.id,
        name: this.systemPrompt.name,
        description: this.systemPrompt.label,
        category: this.systemPrompt.category,
        inputSchema: this.createInputSchema(),
        outputSchema: {
          default: {
            type: "text",
            description: "The agent's response",
          },
        },
        visibleToUser: true,
        isAsynchronous: false,
      };
    }

    private createInputSchema(): AgentInputSchema {
      const schema: AgentInputSchema = {
        user_input: {
          type: "text",
          description: "User input for the agent",
          required: true,
        },
      };

      // Add placeholders from the system prompt as input fields
      this.systemPrompt.promptTemplatePlaceholders.forEach((placeholder) => {
        schema[placeholder.name] = {
          type: placeholder.type === "image" ? "file" : "text",
          description: placeholder.label,
          required: placeholder.requiredByUser,
          default: placeholder.defaultValue || undefined,
        };
      });

      return schema;
    }

    validateInputs(inputs: Record<string, any>): boolean {
      // Check if required inputs are present
      for (const placeholder of this.systemPrompt.promptTemplatePlaceholders) {
        if (placeholder.requiredByUser && !inputs[placeholder.name]) {
          return false;
        }
      }
      return true;
    }

    async run(
      context: ChatSessionContext,
      messages: ChatMessage[],
      variables: Record<string, any>,
      modelOptions: LLMOptions
    ): Promise<AgentExecution> {
      const execution: AgentExecution = {
        id: nanoid(16),
        agentId: this.getDefinition().id,
        status: "running",
        inputs: variables,
        outputs: {},
        startTime: new Date().toISOString(),
      };

      try {
        // Create system message with the template
        let systemMessage = this.systemPrompt.systemPrompt;

        // Replace placeholders in the system prompt
        for (const placeholder of this.systemPrompt
          .promptTemplatePlaceholders) {
          const value =
            variables[placeholder.name] || placeholder.defaultValue || "";
          systemMessage = systemMessage.replace(
            `{{${placeholder.name}}}`,
            value
          );
        }

        // Create user message if template has one
        let userMessage = variables.user_input || "";
        if (this.systemPrompt.userPrompt) {
          userMessage = this.systemPrompt.userPrompt.replace(
            "{{prompt}}",
            userMessage
          );

          // Replace other placeholders in user prompt
          for (const placeholder of this.systemPrompt
            .promptTemplatePlaceholders) {
            const value =
              variables[placeholder.name] || placeholder.defaultValue || "";
            userMessage = userMessage.replace(`{{${placeholder.name}}}`, value);
          }
        }

        // Use LLMAgent to get response
        const llmAgent = new LLMAgent();

        const messages: ChatMessage[] = [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: userMessage,
          },
        ];

        const result = await llmAgent.run(
          context,
          messages,
          variables,
          modelOptions
        );

        execution.outputs.default = result.outputs.default;
        execution.status = "completed";
        execution.endTime = new Date().toISOString();
      } catch (error) {
        execution.status = "failed";
        execution.error = error + "";
        execution.endTime = new Date().toISOString();
      }

      return execution;
    }

    getExecutionStatus(_executionId: string): Promise<AgentExecution | null> {
      // For this simple implementation, we don't track executions
      return Promise.resolve(null);
    }

    cancel(_executionId: string): Promise<boolean> {
      // Simple implementation always returns true
      return Promise.resolve(true);
    }
  }

  // Import LLMAgent at the top of the file
  return new DynamicAgent(sysPrompt);
};
