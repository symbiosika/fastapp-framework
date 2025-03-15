import { AgentDefinition, BaseAgent } from "./types";

class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();
  private agentInstances: Map<string, BaseAgent> = new Map();

  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  registerAgentInstance(id: string, agent: BaseAgent): void {
    this.agentInstances.set(id, agent);
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAgentInstance(id: string): BaseAgent | undefined {
    return this.agentInstances.get(id);
  }

  getVisibleAgents(): AgentDefinition[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.visibleToUser
    );
  }
}

export const agentRegistry = new AgentRegistry();
