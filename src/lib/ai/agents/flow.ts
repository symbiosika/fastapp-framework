import type { AgentContext, Agent, AgentOptions } from "../../types/agents";
import type { ChatStoreVariables } from "../chat/chat-store";
import { DiffAgent } from "./diff-agent";
import { LLMAgent } from "./llm-agent";
import { TTSAgent } from "./tts-agent";

export interface FlowStep {
  // Which agent to call
  agentName: string;
  // A mapping from output of previous steps to the input of this step
  inputMapping: Record<string, string>;
  // A custom label for the output if needed
  outputKey?: string;
  // Agent-specific options
  options?: AgentOptions;
}

export interface FlowDefinition {
  id: string;
  steps: FlowStep[];
}

/**
 * This class holds the logic to run a flow of multiple steps.
 */
export class FlowEngine {
  private agents: Record<string, Agent>;

  constructor() {
    this.agents = {
      llmAgent: new LLMAgent(),
      ttsAgent: new TTSAgent(),
      diffAgent: new DiffAgent(),
    };
  }

  /**
   * Runs a flow of multiple steps.
   * @param flowDef The definition of the flow to run.
   * @param initialInputs The initial inputs to the flow.
   * @param context The context in which to run the flow.
   */
  async runFlow(
    flowDef: FlowDefinition,
    initialInputs: ChatStoreVariables,
    context: AgentContext
  ): Promise<ChatStoreVariables> {
    let currentVariables: ChatStoreVariables = { ...initialInputs };

    for (const step of flowDef.steps) {
      const agent = this.agents[step.agentName];
      if (!agent) {
        throw new Error(`Agent ${step.agentName} not found`);
      }

      // Build the input object from the prior step's outputs
      const stepInputs: ChatStoreVariables = {
        ...initialInputs,
      };

      // Merge the inputMapping into the stepInputs
      for (const [k, v] of Object.entries(step.inputMapping)) {
        stepInputs[k] = currentVariables[v];
      }

      // Run the agent
      const result = await agent.run(context, stepInputs, step.options ?? {});

      // reset currentVariables and set output to user_input for the next step
      currentVariables = {
        user_input: result.outputs.default,
      };
    }

    return currentVariables;
  }
}
