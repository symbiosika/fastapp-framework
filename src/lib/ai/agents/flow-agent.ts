import { generateLongText } from "../standard";
import { initChatMessage } from "../chat/get-prompt-template";
import {
  parseIntFromUnknown,
  parseStringFromUnknown,
} from "../../helper/parsers";
import {
  AgentDefinition,
  AgentState,
  BaseAgent,
  FlowExecution,
  Plan,
  PlanStepStatus,
} from "./types";
import { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { LLMOptions } from "../../../dbSchema";
import { ReActAgent } from "./react-agent";
import { agentRegistry } from "./agent-registry";
import log from "../../../lib/log";

/**
 * FlowAgent class for orchestrating complex agent flows
 * Manages planning and execution of tasks with multiple agents
 */
export class FlowAgent extends ReActAgent {
  agents: Record<string, BaseAgent> = {};
  executorKeys: string[] = [];
  activePlanId: string;
  currentStepIndex?: number;

  constructor(
    name: string = "FlowAgent",
    description: string = "Orchestrates complex agent flows with planning and execution",
    systemPrompt?: string,
    thinkPrompt?: string,
    actPrompt?: string,
    agents: Record<string, BaseAgent> = {},
    options: Record<string, any> = {}
  ) {
    super(name, description, systemPrompt, thinkPrompt, actPrompt);

    // Set executorKeys
    this.executorKeys = options.executors || [];

    // Set plan ID
    this.activePlanId = options.planId || `plan_${Date.now()}`;

    // Set agents
    this.agents = agents;

    // Set executorKeys to all agent keys if not specified
    if (this.executorKeys.length === 0 && Object.keys(this.agents).length > 0) {
      this.executorKeys = Object.keys(this.agents);
    }

    // Default system prompt for planning if not provided
    if (!this.systemPrompt) {
      this.systemPrompt = `You are an AI agent orchestrator that can plan and execute complex tasks.
You will be given a user request, and your job is to break it down into steps, then execute each step.
You can use various tools and agents to accomplish the task.`;
    }

    // Default think prompt if not provided
    if (!this.thinkPrompt) {
      this.thinkPrompt = `Think about the current state of the task and decide what to do next.
If you need to create or update a plan, do so.
If you need to execute a step in the plan, decide which agent or tool to use.
Return true if you need to take an action, false if the task is complete.`;
    }

    // Default act prompt if not provided
    if (!this.actPrompt) {
      this.actPrompt = `Execute the current step in the plan.
If you need to use a tool or agent, do so.
Return the result of the action.`;
    }
  }

  getDefinition(): AgentDefinition {
    return {
      id: "flow-agent",
      name: this.name,
      description: this.description || "Orchestrates complex agent flows",
      category: "flow",
      inputSchema: {
        user_input: {
          type: "text",
          description: "The user input to process",
          required: true,
        },
        agents: {
          type: "array",
          description: "List of agent IDs to use in the flow",
          required: false,
        },
        max_steps: {
          type: "number",
          description: "Maximum number of steps to execute",
          required: false,
        },
      },
      outputSchema: {
        default: {
          type: "text",
          description: "The final result of the flow execution",
        },
        plan: {
          type: "text",
          description: "The execution plan",
        },
      },
      visibleToUser: true,
      isAsynchronous: true,
    };
  }

  /**
   * Gets a suitable executor agent for the current step
   * @param stepType The type of step
   * @returns The selected agent
   */
  getExecutor(stepType?: string): BaseAgent | undefined {
    // Simple implementation: use the first executor
    if (this.executorKeys.length > 0) {
      return this.agents[this.executorKeys[0]];
    }
    return undefined;
  }

  /**
   * Creates a plan based on the input
   * @param userInput The input for the plan
   * @returns The created plan
   */
  async createPlan(
    context: ChatSessionContext,
    userInput: string,
    modelOptions: LLMOptions
  ): Promise<Plan> {
    log.logCustom({ name: "FlowAgent" }, `Creating plan for: ${userInput}`);

    // Create a planning prompt
    const planningPrompt = `
You are an AI planning agent. Your task is to create a step-by-step plan to accomplish the following goal:

${userInput}

Create a plan with clear, executable steps. Each step should be specific and actionable.
Format your response as a JSON object with the following structure:
{
  "goal": "The main goal to accomplish",
  "steps": [
    {
      "id": "step_1",
      "description": "Detailed description of what needs to be done",
      "dependencies": [] // IDs of steps that must be completed before this one
    },
    // more steps...
  ]
}
`;

    // Generate the plan using LLM
    const planMessages: ChatMessage[] = [
      initChatMessage(planningPrompt, "system", {
        timestamp: new Date().toISOString(),
      }),
      initChatMessage(userInput, "user", {
        human: true,
        timestamp: new Date().toISOString(),
      }),
    ];

    const llmOptions = {
      maxTokens: parseIntFromUnknown(modelOptions?.maxTokens),
      model: parseStringFromUnknown(modelOptions?.model),
      temperature:
        modelOptions?.temperature !== undefined
          ? Number(modelOptions.temperature)
          : 0.2,
      outputType: "text" as const,
    };

    const result = await generateLongText(
      planMessages as any,
      llmOptions,
      context
    );

    try {
      // Parse the plan from the LLM response
      const planJson = JSON.parse(result.text);

      // Validate and format the plan
      const plan: Plan = {
        id: this.activePlanId,
        goal: planJson.goal || userInput,
        steps: (planJson.steps || []).map((step: any, index: number) => ({
          id: step.id || `step_${index + 1}`,
          description: step.description,
          status: PlanStepStatus.NOT_STARTED,
          dependencies: step.dependencies || [],
        })),
      };

      return plan;
    } catch (error) {
      log.error("Failed to parse plan from LLM response", error + "");

      // Fallback to a simple plan
      return {
        id: this.activePlanId,
        goal: userInput,
        steps: [
          {
            id: "step_1",
            description: `Execute the task: ${userInput}`,
            status: PlanStepStatus.NOT_STARTED,
            dependencies: [],
          },
        ],
      };
    }
  }

  /**
   * Executes a plan
   * @param plan The plan to execute
   * @returns The result of the execution
   */
  async executePlan(
    context: ChatSessionContext,
    plan: Plan,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string> {
    log.logCustom({ name: "FlowAgent" }, `Executing plan: ${plan.id}`);

    // Get the executor agent
    const executor = this.getExecutor();
    if (!executor) {
      throw new Error("No executor agent available");
    }

    // Execute the plan
    const results: string[] = [];

    for (const step of plan.steps) {
      log.logCustom(
        { name: "FlowAgent" },
        `Executing step: ${step.id} - ${step.description}`
      );

      // Update step status
      step.status = PlanStepStatus.IN_PROGRESS;

      // Check if all dependencies are completed
      const dependencies = step.dependencies || [];
      const allDependenciesCompleted = dependencies.every((depId) => {
        const depStep = plan.steps.find((s) => s.id === depId);
        return depStep && depStep.status === PlanStepStatus.COMPLETED;
      });

      if (!allDependenciesCompleted) {
        step.status = PlanStepStatus.BLOCKED;
        results.push(`Step ${step.id} is blocked by dependencies`);
        continue;
      }

      try {
        // Execute the step
        const stepExecution = await executor.run(
          context,
          [
            ...this.memory,
            initChatMessage(step.description, "user", { human: true }),
          ],
          { ...variables, step_description: step.description },
          modelOptions
        );

        // Store the result
        const stepResult = stepExecution.outputs.default || "No result";
        step.result = stepResult;
        results.push(`Step ${step.id}: ${stepResult}`);

        // Update step status
        step.status = PlanStepStatus.COMPLETED;

        // Add the result to memory
        this.updateMemory("assistant", stepResult);
      } catch (error: any) {
        step.status = PlanStepStatus.FAILED;
        step.result = `Error: ${error.message}`;
        results.push(`Step ${step.id} failed: ${error.message}`);
      }
    }

    return results.join("\n\n");
  }

  /**
   * Processes the current state and decides on the next action
   */
  async think(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<boolean> {
    // If we don't have a plan yet, create one
    if (!variables.plan) {
      const userInput = variables.user_input || "";
      const plan = await this.createPlan(context, userInput, modelOptions);
      variables.plan = plan;

      // Add the plan to memory
      const planDescription = `Created plan with ${plan.steps.length} steps to achieve: ${plan.goal}`;
      this.updateMemory("assistant", planDescription);

      return true; // We need to act (execute the plan)
    }

    // If we have a plan, check if it's completed
    const plan = variables.plan as Plan;
    const allStepsCompleted = plan.steps.every(
      (step) =>
        step.status === PlanStepStatus.COMPLETED ||
        step.status === PlanStepStatus.FAILED
    );

    if (allStepsCompleted) {
      // Plan is completed, we're done
      this.state = AgentState.FINISHED;
      return false;
    }

    // We need to continue executing the plan
    return true;
  }

  /**
   * Executes the decided action
   */
  async act(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string> {
    const plan = variables.plan as Plan;
    return await this.executePlan(context, plan, variables, modelOptions);
  }

  /**
   * Executes the main execution cycle of the agent
   */
  async run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<FlowExecution> {
    // Set max steps from variables if provided
    if (variables.max_steps) {
      this.maxSteps = parseInt(variables.max_steps);
    }

    // Initialize agents if provided in variables
    if (variables.agents && Array.isArray(variables.agents)) {
      for (const agentId of variables.agents) {
        const agentDef = agentRegistry.getAgent(agentId);
        if (agentDef) {
          // Here you would instantiate the agent based on the definition
          // This is a placeholder and would need to be implemented based on your agent factory
          log.logCustom(
            { name: "FlowAgent" },
            `Adding agent ${agentId} to flow`
          );
        }
      }
    }

    // Run the agent
    const execution = (await super.run(
      context,
      messages,
      variables,
      modelOptions
    )) as FlowExecution;

    // Add plan to execution
    if (variables.plan) {
      execution.plan = variables.plan as Plan;
    }

    return execution;
  }
}
