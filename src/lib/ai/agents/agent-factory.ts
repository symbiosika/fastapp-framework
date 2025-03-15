import { AgentDefinition, BaseAgent } from "./types";
import { LLMAgent } from "./llm-agent";
import { FlowAgent } from "./flow-agent";
import { DiffAgent } from "./diff-agent";
import { SummarizeTextAgent } from "./summarize-agent";
import { TTSAgent } from "./tts-agent";
import { agentRegistry } from "./agent-registry";
import log from "../../../lib/log";

/**
 * Factory for creating agent instances based on agent definitions
 */
export class AgentFactory {
  /**
   * Creates an agent instance based on the agent definition
   * @param agentDef The agent definition
   * @returns The agent instance
   */
  static createAgent(agentDef: AgentDefinition): BaseAgent | undefined {
    try {
      // Check if we already have an instance of this agent
      const existingInstance = agentRegistry.getAgentInstance(agentDef.id);
      if (existingInstance) {
        return existingInstance;
      }

      // Create a new instance based on the agent type
      let agent: BaseAgent | undefined;

      switch (agentDef.id) {
        case "llm-agent":
          agent = new LLMAgent();
          break;
        case "flow-agent":
          agent = new FlowAgent();
          break;
        case "diff-agent":
          agent = new DiffAgent();
          break;
        case "summarize-agent":
          agent = new SummarizeTextAgent();
          break;
        case "tts-agent":
          agent = new TTSAgent();
          break;
        default:
          log.error(`Unknown agent type: ${agentDef.id}`);
          return undefined;
      }

      // Register the agent instance
      if (agent) {
        agentRegistry.registerAgentInstance(agentDef.id, agent);
      }
      return agent;
    } catch (error: any) {
      log.error(
        `Error creating agent instance for ${agentDef.id}`,
        error.message || String(error)
      );
      return undefined;
    }
  }

  /**
   * Creates an agent instance based on the agent ID
   * @param agentId The agent ID
   * @returns The agent instance
   */
  static createAgentById(agentId: string): BaseAgent | undefined {
    const agentDef = agentRegistry.getAgent(agentId);
    if (!agentDef) {
      log.error(`Agent definition not found for ID: ${agentId}`);
      return undefined;
    }
    return AgentFactory.createAgent(agentDef);
  }

  /**
   * Creates a flow agent with the specified agents
   * @param agents The agents to include in the flow
   * @param options Additional options for the flow agent
   * @returns The flow agent instance
   */
  static createFlowAgent(
    agents: Record<string, BaseAgent> = {},
    options: Record<string, any> = {}
  ): FlowAgent {
    const flowAgent = new FlowAgent(
      options.name || "FlowAgent",
      options.description || "Orchestrates complex agent flows",
      options.systemPrompt,
      options.thinkPrompt,
      options.actPrompt,
      agents,
      options
    );

    // Register the flow agent
    agentRegistry.registerAgentInstance("flow-agent", flowAgent);
    return flowAgent;
  }
}
