import { nanoid } from "nanoid";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { chatStore } from "../chat/chat-store";
import type {
  AgentConfig,
  AgentExecution,
  AgentExecutionResult,
  AgentHooks,
  AgentModelSettings,
  AgentTool,
  InputGuardrail,
  OutputGuardrail,
} from "./types";
import log from "../../../lib/log";
import { chatCompletion } from "../standard";
import type { Message } from "../standard/types";

export class Agent {
  private config: AgentConfig;
  private hooks?: AgentHooks;

  constructor(config: AgentConfig, hooks?: AgentHooks) {
    this.config = config;
    this.hooks = hooks;
  }

  public get name(): string {
    return this.config.name;
  }

  public get instructions():
    | string
    | ((context: ChatSessionContext) => string) {
    return this.config.instructions;
  }

  public get model(): string {
    return this.config.model;
  }

  public get modelSettings(): AgentModelSettings | undefined {
    return this.config.modelSettings;
  }

  public get tools(): AgentTool[] | undefined {
    return this.config.tools;
  }

  public get handoffs(): AgentConfig[] | undefined {
    return this.config.handoffs;
  }

  public get outputType(): any {
    return this.config.outputType;
  }

  public clone(overrides: Partial<AgentConfig>): Agent {
    return new Agent(
      {
        ...this.config,
        ...overrides,
      },
      this.hooks
    );
  }

  public async getSystemPrompt(
    context: ChatSessionContext
  ): Promise<string | null> {
    if (typeof this.config.instructions === "string") {
      return this.config.instructions;
    } else if (typeof this.config.instructions === "function") {
      return this.config.instructions(context);
    }
    return null;
  }

  public async run(
    input: string | ChatMessage[],
    context: ChatSessionContext,
    inputGuardrails: InputGuardrail[] = [],
    outputGuardrails: OutputGuardrail[] = []
  ): Promise<AgentExecutionResult> {
    const executionId = nanoid(16);
    const startTime = new Date().toISOString();

    // Create execution record
    const execution: AgentExecution = {
      id: executionId,
      agentId: this.config.name,
      status: "pending",
      startTime,
      input,
      messages: [],
      context,
      variables: {},
    };

    try {
      // Update status to running
      execution.status = "running";

      // Call onStart hooks if available
      if (this.hooks?.onStart) {
        await this.hooks.onStart(execution);
      }

      // Check input guardrails
      for (const guardrail of inputGuardrails) {
        const result = await guardrail.check(input, context);
        if (!result.allowed) {
          throw new Error(
            `Input guardrail "${guardrail.name}" failed: ${result.reason}`
          );
        }
      }

      // Get or create chat session
      let chatSession = await chatStore.get(context.chatId);
      if (!chatSession) {
        chatSession = await chatStore.create({
          chatId: context.chatId,
          context: {
            userId: context.userId,
            organisationId: context.organisationId,
            chatSessionGroupId: context.chatSessionGroupId,
          },
        });
      }

      // Process input messages
      let userMessages: ChatMessage[] = [];
      if (typeof input === "string") {
        const userMessage: ChatMessage = {
          role: "user",
          content: input,
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
            human: true,
          },
        };
        userMessages = [userMessage];
      } else {
        userMessages = input;
      }

      // Add system message if needed
      const systemPrompt = await this.getSystemPrompt(context);
      let messages: ChatMessage[] = [];

      if (systemPrompt) {
        const systemMessage: ChatMessage = {
          role: "system",
          content: systemPrompt,
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
          },
        };
        messages.push(systemMessage);
      }

      // Add user messages
      messages = [...messages, ...userMessages];

      // Add messages to chat session
      chatSession.messages = [...chatSession.messages, ...userMessages];
      await chatStore.set(context.chatId, { messages: chatSession.messages });

      // TODO: Implement the actual LLM call and tool execution logic
      const llmResult = await chatCompletion(messages as Message[], {
        model: this.config.model,
        temperature: this.config.modelSettings?.temperature,
        maxTokens: this.config.modelSettings?.maxTokens,
      });

      // Process tool calls if present in the response
      let assistantContent = llmResult.text;
      let toolResults: Array<{ tool: string; args: any; result: any }> = [];

      // Check if the response contains tool calls - this is a mock implementation
      // In a real implementation, the LLM would return tool calls in a structured format
      const mockToolCalls = this.extractToolCallsFromResponse(llmResult.text);

      if (mockToolCalls.length > 0) {
        assistantContent = ""; // Will be populated with tool results

        // Process each tool call
        for (const toolCall of mockToolCalls) {
          const { name, args } = toolCall;

          // Find the tool
          const tool = this.config.tools?.find((t) => t.name === name);
          if (!tool) {
            throw new Error(`Tool "${name}" not found`);
          }

          // Call onToolStart hook if available
          if (this.hooks?.onToolStart) {
            await this.hooks.onToolStart(execution, tool);
          }

          try {
            // Execute the tool
            const result = await tool.function(args, context);

            // Add tool result to the list
            toolResults.push({
              tool: name,
              args,
              result,
            });

            // Update assistant content with tool result
            assistantContent += `\nTool: ${name}\nResult: ${JSON.stringify(result, null, 2)}\n`;

            // Call onToolEnd hook if available
            if (this.hooks?.onToolEnd) {
              await this.hooks.onToolEnd(execution, tool, result);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            assistantContent += `\nTool: ${name}\nError: ${errorMessage}\n`;

            // Call onToolEnd hook with error if available
            if (this.hooks?.onToolEnd) {
              await this.hooks.onToolEnd(execution, tool, {
                error: errorMessage,
              });
            }
          }
        }

        // Store tool results in execution variables
        execution.variables = {
          ...execution.variables,
          toolResults: JSON.stringify(toolResults),
        };

        // Make a follow-up call to the LLM with the tool results
        const followUpMessages = [
          ...messages,
          {
            role: "assistant",
            content: "I need to use some tools to help with this.",
            meta: {
              id: nanoid(10),
              model: this.config.model,
              timestamp: new Date().toISOString(),
            },
          },
          {
            role: "system",
            content: `Tool results:\n${assistantContent}`,
            meta: {
              id: nanoid(10),
              timestamp: new Date().toISOString(),
            },
          },
        ];

        // Get the final response from the LLM
        assistantContent = (
          await chatCompletion(followUpMessages as Message[], {
            model: this.config.model,
            temperature: this.config.modelSettings?.temperature,
            maxTokens: this.config.modelSettings?.maxTokens,
          })
        ).text;
      }

      // Create the assistant message
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantContent,
        meta: {
          id: nanoid(10),
          model: this.config.model,
          timestamp: new Date().toISOString(),
        },
      };

      // Add assistant message to chat session
      chatSession.messages.push(assistantMessage);
      await chatStore.set(context.chatId, { messages: chatSession.messages });

      // Check output guardrails
      let output = assistantMessage.content;
      for (const guardrail of outputGuardrails) {
        const result = await guardrail.check(output, context);
        if (!result.allowed) {
          throw new Error(
            `Output guardrail "${guardrail.name}" failed: ${result.reason}`
          );
        }
        if (result.modifiedOutput !== undefined) {
          output = result.modifiedOutput;
        }
      }

      // Update execution record
      execution.status = "completed";
      execution.endTime = new Date().toISOString();
      execution.output = output;
      execution.messages = [...messages, assistantMessage];

      // Call onEnd hooks if available
      if (this.hooks?.onEnd) {
        await this.hooks.onEnd(execution);
      }

      return {
        output,
        messages: execution.messages,
        variables: execution.variables,
      };
    } catch (error) {
      // Update execution record
      execution.status = "failed";
      execution.endTime = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : String(error);

      // Call onError hooks if available
      if (this.hooks?.onError) {
        await this.hooks.onError(
          execution,
          error instanceof Error ? error : new Error(String(error))
        );
      }

      log.error(`Agent execution failed: ${execution.error}`, {
        agentId: this.config.name,
        executionId,
      });

      throw error;
    }
  }

  /**
   * Extract tool calls from a response string
   * This is a mock implementation that looks for patterns like "use tool: tool_name(args)"
   * In a real implementation, the LLM would return tool calls in a structured format
   */
  private extractToolCallsFromResponse(
    response: string
  ): Array<{ name: string; args: any }> {
    const toolCalls: Array<{ name: string; args: any }> = [];

    // Check if we have tools configured
    if (!this.config.tools || this.config.tools.length === 0) {
      return toolCalls;
    }

    // Simple regex to find tool calls in the format "use tool: tool_name(args)"
    const toolRegex = /use tool:\s*(\w+)\(([^)]*)\)/gi;
    let match;

    while ((match = toolRegex.exec(response)) !== null) {
      const toolName = match[1];
      const argsStr = match[2];

      // Find the tool
      const tool = this.config.tools.find((t) => t.name === toolName);
      if (tool) {
        // Parse arguments
        let args: Record<string, string> = {};
        try {
          // Try to parse as JSON
          args = JSON.parse(`{${argsStr}}`);
        } catch (e) {
          // Simple parsing for key=value pairs
          const argPairs = argsStr.split(",");
          argPairs.forEach((pair) => {
            const [key, value] = pair.split("=").map((s) => s.trim());
            if (key && value) {
              args[key] = value;
            }
          });
        }

        toolCalls.push({
          name: toolName,
          args,
        });
      }
    }

    return toolCalls;
  }
}
