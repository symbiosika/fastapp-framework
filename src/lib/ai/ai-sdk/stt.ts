import { openAiSpeechToText, SpeechToTextResponse } from "./openai";
import log from "../../log";
import { UserContext } from "./types";

export async function speechToText(
  audioData: File | string,
  context: UserContext,
  options?: {
    providerAndModelName?: string;
    returnSegments?: boolean;
    returnWords?: boolean;
  }
): Promise<SpeechToTextResponse> {
  let providerAndModelName = options?.providerAndModelName;
  if (!providerAndModelName) {
    providerAndModelName = process.env.DEFAULT_STT_MODEL ?? "openai:whisper-1";
  }

  const [providerName, modelName] = providerAndModelName.split(":");

  const result = await openAiSpeechToText(audioData, {
    model: modelName,
    returnSegments: options?.returnSegments,
    returnWords: options?.returnWords,
  });

  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.chatId,
    source: "ai",
    category: "stt",
    message: "speech-to-text-complete",
    metadata: {
      model: modelName,
      provider: providerName,
      textLength: result.text.length,
      hasSegments: !!result.segments,
      hasWords: !!result.words,
    },
  });

  return {
    text: result.text,
    segments: result.segments,
    words: result.words,
    meta: {
      model: result.meta.model,
    },
  };
}
