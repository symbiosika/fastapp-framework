import OpenAIClient from "openai";
import fs from "fs/promises";
import { basename } from "path";
import { nanoid } from "nanoid";

export interface SpeechToTextResponse {
  text: string;
  segments?: any[];
  words?: any[];
  meta: {
    model: string;
  };
}

type WhisperResponse = {
  task: string;
  language: string;
  duration: number;
  text: string;
};

type Segment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

type Word = {
  word: string;
  start: number;
  end: number;
};

type WhisperResponseWithSegmentsAndWords = WhisperResponse & {
  segments: Segment[];
  words: Word[];
};

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function openAiSpeechToText(
  audioData: File | string,
  options: {
    model: string;
    returnSegments?: boolean;
    returnWords?: boolean;
  }
): Promise<SpeechToTextResponse> {
  let fileToUpload: File;

  if (audioData instanceof File) {
    fileToUpload = audioData;
  } else {
    const fileBuffer = await fs.readFile(audioData);
    const fileName = basename(audioData);
    fileToUpload = new File([fileBuffer], fileName);
  }

  const createTimestampGranularities: ("segment" | "word")[] = [];
  if (options?.returnSegments) {
    createTimestampGranularities.push("segment");
  }
  if (options?.returnWords) {
    createTimestampGranularities.push("word");
  }

  const transcription = await client.audio.transcriptions.create({
    file: fileToUpload,
    model: options.model,
    response_format: "verbose_json",
    timestamp_granularities: createTimestampGranularities,
  });

  const result =
    transcription as unknown as WhisperResponseWithSegmentsAndWords;

  return {
    text: result.text,
    segments: result.segments,
    words: result.words,
    meta: {
      model: "openai:" + options.model,
    },
  };
}

export async function openAiTextToSpeech(
  text: string,
  options: {
    model: string;
    voice?: string;
  }
): Promise<{
  file: File;
  filename: string;
  meta: {
    model: string;
  };
}> {
  const voice = options?.voice || "alloy";

  const mp3 = await client.audio.speech.create({
    model: options.model,
    voice: voice as any,
    input: text,
  });

  const buffer = await mp3.arrayBuffer();
  const id = nanoid(16);
  const filename = `${id}.mp3`;

  const file = new File([buffer], filename, { type: "audio/mp3" });

  return {
    file,
    filename,
    meta: {
      model: "openai:" + options.model,
    },
  };
}
