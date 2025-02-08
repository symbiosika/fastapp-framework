import type {
  Agent,
  AgentContext,
  AgentOptions,
  AgentOutput,
  AgentInputVariables,
} from "../../types/agents";

export class TTSAgent implements Agent {
  name = "ttsAgent";

  async run(
    context: AgentContext,
    inputs: AgentInputVariables,
    options: AgentOptions
  ): Promise<AgentOutput> {
    // The "default" input variable is "user_input", but your code can adapt:
    const userInput = inputs.user_input + "";

    // hack: just return a dummy text
    const demoUrl = "https://localhost:3000/demo.mp3";

    // Return the LLM result as "default"
    return {
      outputs: {
        default: demoUrl,
      },
      metadata: {},
    };
  }
}
