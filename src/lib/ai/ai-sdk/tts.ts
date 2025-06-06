import log from "../../../lib/log";
import { openAiTextToSpeech } from "./openai";
import type { OrganisationContext } from "./types";

/**
 * Text to Speech
 */
export const textToSpeech = async (
  text: string,
  context: OrganisationContext,
  options?: {
    providerAndModelName?: string;
    voice?: string;
  }
): Promise<{
  file: File;
  filename: string;
  model: string;
}> => {
  try {
    let providerAndModelName = options?.providerAndModelName;
    if (!providerAndModelName) {
      providerAndModelName =
        process.env.DEFAULT_TTS_MODEL ?? "openai:gpt-4o-mini-tts";
    }
    const [providerName, modelName] = providerAndModelName.split(":");

    const r = await openAiTextToSpeech(text, {
      model: modelName,
      voice: options?.voice,
    });

    log.logToDB({
      level: "info",
      organisationId: context?.organisationId,
      sessionId: context?.chatId,
      source: "ai",
      category: "tts",
      message: "text-to-speech-complete",
      metadata: {
        model: modelName,
        provider: providerName,
        filename: r.filename,
      },
    });

    return {
      file: r.file,
      filename: r.filename,
      model: providerAndModelName,
    };
  } catch (error) {
    log.error(`Error in textToSpeech: ${error}`);
    throw new Error("Failed to convert text to speech");
  }
};
