import { AgentDefinition } from "./types";

class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();

  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getVisibleAgents(): AgentDefinition[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.visibleToUser
    );
  }
}

export const agentRegistry = new AgentRegistry();
