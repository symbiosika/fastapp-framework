import { Agent } from "../agent";
import { textToSpeechTool, speechToTextTool } from "../tool";
import { Runner } from "../runner";

/**
 * Example of creating an agent with speech tools
 */
export function createSpeechAgent() {
  // Create an agent with text-to-speech and speech-to-text tools
  const speechAgent = new Agent({
    name: "SpeechAssistant",
    instructions: `You are a helpful assistant that can convert text to speech and speech to text.
    Use the text_to_speech tool when a user wants to hear something spoken.
    Use the speech_to_text tool when a user wants to transcribe audio.`,
    model: "gpt-4o",
    tools: [
      textToSpeechTool(),
      speechToTextTool()
    ]
  });

  return speechAgent;
}

/**
 * Example of using the speech agent
 */
export async function runSpeechExample() {
  const speechAgent = createSpeechAgent();
  
  // Create a context for the agent
  const context = Runner.createExecutionContext(
    "user-123",
    "org-456"
  );
  
  // Example 1: Convert text to speech
  console.log("Example 1: Converting text to speech");
  const ttsResult = await Runner.run(
    speechAgent,
    "Please convert this sentence to speech using a female voice.",
    context
  );
  console.log("TTS Result:", ttsResult.output);
  
  // Example 2: Transcribe speech to text
  console.log("\nExample 2: Transcribing speech to text");
  const sttResult = await Runner.run(
    speechAgent,
    "I have an audio file at /path/to/recording.mp3 that I need to transcribe.",
    context
  );
  console.log("STT Result:", sttResult.output);
  
  return {
    ttsResult,
    sttResult
  };
}

// Run the example if this file is executed directly
if (require.main === module) {
  runSpeechExample()
    .then(() => console.log("Speech example completed successfully"))
    .catch(error => console.error("Error running speech example:", error));
} 