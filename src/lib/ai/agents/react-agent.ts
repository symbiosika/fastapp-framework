import { nanoid } from "nanoid";
import { initChatMessage } from "../chat/get-prompt-template";
import {
  AgentDefinition,
  AgentExecution,
  AgentState,
  AgentTool,
  BaseAgent,
} from "./types";
import { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { LLMOptions } from "../../../dbSchema";

/**
 * Abstract base class for agents that follow the ReAct pattern (Reason + Act)
 * Extends the basic agent functionality with a two-phase execution cycle: thinking and acting
 */
export abstract class ReActAgent implements BaseAgent {
  name: string;
  description?: string;
  systemPrompt?: string;
  thinkPrompt?: string;
  actPrompt?: string;
  tools: AgentTool[] = [];
  maxSteps: number = 10;
  currentStep: number = 0;
  state: AgentState = AgentState.IDLE;
  memory: ChatMessage[] = [];
  duplicateThreshold: number = 2;

  constructor(
    name: string,
    description?: string,
    systemPrompt?: string,
    thinkPrompt?: string,
    actPrompt?: string
  ) {
    this.name = name;
    this.description = description;
    this.systemPrompt = systemPrompt;
    this.thinkPrompt = thinkPrompt;
    this.actPrompt = actPrompt;
  }

  abstract getDefinition(): AgentDefinition;

  /**
   * Executes a state transition and ensures the state is restored after execution
   */
  async withState<T>(
    newState: AgentState,
    callback: () => Promise<T>
  ): Promise<T> {
    const previousState = this.state;
    this.state = newState;

    try {
      return await callback();
    } catch (error) {
      this.state = AgentState.ERROR;
      throw error;
    } finally {
      this.state = previousState;
    }
  }

  /**
   * Adds a message to the agent's memory
   */
  updateMemory(
    role: "system" | "user" | "assistant" | "developer",
    content: string,
    options: Record<string, any> = {}
  ): void {
    const message = initChatMessage(content, role, {
      ...options,
      timestamp: new Date().toISOString(),
    });

    this.memory.push(message);
  }

  /**
   * Processes the current state and decides on the next action
   * @returns True if an action should be executed, otherwise False
   */
  abstract think(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<boolean>;

  /**
   * Executes the decided action
   * @returns The result of the action
   */
  abstract act(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string>;

  /**
   * Executes a single step: thinking and acting
   */
  async step(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string> {
    const shouldAct = await this.withState(AgentState.THINKING, () =>
      this.think(context, variables, modelOptions)
    );

    if (!shouldAct) {
      return "Thinking completed - no action required";
    }

    return await this.withState(AgentState.ACTING, () =>
      this.act(context, variables, modelOptions)
    );
  }

  /**
   * Executes the main execution cycle of the agent
   */
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
      // Initialize memory with system prompt and messages
      this.memory = [];
      if (this.systemPrompt) {
        this.updateMemory("system", this.systemPrompt);
      }

      // Add existing messages to memory
      this.memory = [...this.memory, ...messages];

      // Add user input if provided
      const userInput = variables.user_input || "";
      if (
        userInput &&
        (this.memory.length === 0 ||
          this.memory[this.memory.length - 1].role !== "user")
      ) {
        this.updateMemory("user", userInput, { human: true });
      }

      const results: string[] = [];

      await this.withState(AgentState.RUNNING, async () => {
        while (
          this.currentStep < this.maxSteps &&
          this.state !== AgentState.FINISHED
        ) {
          this.currentStep++;
          console.log(`Executing step ${this.currentStep}/${this.maxSteps}`);

          const stepResult = await this.step(context, variables, modelOptions);
          results.push(`Step ${this.currentStep}: ${stepResult}`);

          // Check for stuck state
          if (this.isStuck()) {
            this.handleStuckState();
          }
        }

        if (this.currentStep >= this.maxSteps) {
          this.currentStep = 0;
          this.state = AgentState.IDLE;
          results.push(
            `Finished: Maximum number of steps reached (${this.maxSteps})`
          );
        }
      });

      // Set the final result
      execution.outputs.default = results.join("\n");
      execution.status = "completed";
      execution.endTime = new Date().toISOString();
    } catch (error: any) {
      execution.status = "failed";
      execution.error = error.message;
      execution.endTime = new Date().toISOString();
    }

    return execution;
  }

  /**
   * Handles a stuck state by adding a prompt to change strategy
   */
  handleStuckState(): void {
    const stuckPrompt =
      "Duplicate responses detected. Consider new strategies and avoid repeating ineffective paths.";
    this.thinkPrompt = `${stuckPrompt}\n${this.thinkPrompt || ""}`;
    console.warn(`Agent detected stuck state. Added prompt: ${stuckPrompt}`);
  }

  /**
   * Checks if the agent is stuck in a loop by detecting duplicate content
   */
  isStuck(): boolean {
    if (this.memory.length < 2) {
      return false;
    }

    const lastMessage = this.memory[this.memory.length - 1];
    if (!lastMessage.content) {
      return false;
    }

    // Count identical contents
    let duplicateCount = 0;
    for (let i = this.memory.length - 2; i >= 0; i--) {
      const msg = this.memory[i];
      if (msg.role === "assistant" && msg.content === lastMessage.content) {
        duplicateCount++;
      }
    }

    return duplicateCount >= this.duplicateThreshold;
  }

  validateInputs(inputs: Record<string, any>): boolean {
    // Either user_input or messages should be provided
    return (
      typeof inputs.user_input === "string" || Array.isArray(inputs.messages)
    );
  }

  getExecutionStatus(executionId: string): Promise<AgentExecution | null> {
    return Promise.resolve(null);
  }

  cancel(executionId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
