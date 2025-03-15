/**
 * Agent-System
 * 
 * Alle Agenten basieren auf dem ReAct-Muster (Reason + Act), das einen zweistufigen Ausführungszyklus implementiert:
 * 1. Thinking: Analyse der aktuellen Situation und Entscheidung über die nächste Aktion
 * 2. Acting: Ausführung der entschiedenen Aktion
 * 
 * Einfache Agenten können das Thinking überspringen oder vereinfachen, indem sie immer true zurückgeben.
 * Komplexe Agenten wie der FlowAgent können mehrere Schritte planen und ausführen.
 */

import { LLMAgent } from "./llm-agent";
import { FlowAgent } from "./flow-agent";
import { DiffAgent } from "./diff-agent";
import { SummarizeTextAgent } from "./summarize-agent";
import { TTSAgent } from "./tts-agent";
import { agentRegistry } from "./agent-registry";
import log from "../../../lib/log";

// Register all agents
export function registerAgents() {
  log.logCustom({ name: "AgentSystem" }, "Registering agents...");

  // Register LLM Agent
  const llmAgent = new LLMAgent();
  agentRegistry.registerAgent(llmAgent.getDefinition());
  agentRegistry.registerAgentInstance("llm-agent", llmAgent);

  // Register Flow Agent
  const flowAgent = new FlowAgent();
  agentRegistry.registerAgent(flowAgent.getDefinition());
  agentRegistry.registerAgentInstance("flow-agent", flowAgent);

  // Register Diff Agent
  const diffAgent = new DiffAgent();
  agentRegistry.registerAgent(diffAgent.getDefinition());
  agentRegistry.registerAgentInstance("diff-text", diffAgent);

  // Register Summarize Agent
  const summarizeAgent = new SummarizeTextAgent();
  agentRegistry.registerAgent(summarizeAgent.getDefinition());
  agentRegistry.registerAgentInstance("summarize-text", summarizeAgent);

  // Register TTS Agent
  const ttsAgent = new TTSAgent();
  agentRegistry.registerAgent(ttsAgent.getDefinition());
  agentRegistry.registerAgentInstance("tts-agent", ttsAgent);

  log.logCustom(
    { name: "AgentSystem" },
    `Registered ${Object.keys(agentRegistry.getVisibleAgents()).length} agents`
  );
}

// Export all agents
export * from "./llm-agent";
export * from "./flow-agent";
export * from "./diff-agent";
export * from "./summarize-agent";
export * from "./tts-agent";
export * from "./react-agent";
export * from "./types";
export * from "./agent-registry";
export * from "./agent-factory"; 