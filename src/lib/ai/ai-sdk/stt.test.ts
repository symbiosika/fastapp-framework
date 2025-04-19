import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORG1_USER_1,
} from "../../../test/init.test";
import { speechToText } from "./stt";
import { textToSpeech } from "./tts";
import fs from "fs/promises";

describe("Speech to Text", () => {
  let audioFilePath: string;
  const testText = "This is a test for speech to text conversion.";

  beforeAll(async () => {
    await initTests();

    // Create test audio file using TTS
    const ttsResult = await textToSpeech(testText, {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
    });

    audioFilePath = "./test_audio_stt.mp3";
    await fs.writeFile(
      audioFilePath,
      Buffer.from(await ttsResult.file.arrayBuffer())
    );
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(audioFilePath);
    } catch (error) {
      console.error("Error cleaning up test files:", error);
    }
  });

  it("should convert speech to text with default model", async () => {
    const audioFile = new File(
      [await fs.readFile(audioFilePath)],
      "test_audio.mp3",
      { type: "audio/mpeg" }
    );

    const result = await speechToText(audioFile, {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
    });

    expect(result.text).toBeDefined();
    expect(result.meta.model).toBeDefined();
    // The transcribed text might not be exactly the same, but should contain similar words
    expect(result.text.toLowerCase()).toContain("test");
  });

  it("should convert speech to text with specific model", async () => {
    const audioFile = new File(
      [await fs.readFile(audioFilePath)],
      "test_audio.mp3",
      { type: "audio/mpeg" }
    );

    const result = await speechToText(audioFile, {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
    });

    expect(result.text).toBeDefined();
    expect(result.meta.model).toBe("openai:whisper-1");
  });

  it("should return segments when requested", async () => {
    const audioFile = new File(
      [await fs.readFile(audioFilePath)],
      "test_audio.mp3",
      { type: "audio/mpeg" }
    );

    const result = await speechToText(
      audioFile,
      {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_1.id,
      },
      {
        returnSegments: true,
      }
    );

    expect(result.text).toBeDefined();
    expect(result.segments).toBeDefined();
    expect(Array.isArray(result.segments)).toBeTruthy();
  });

  it("should return words when requested", async () => {
    const audioFile = new File(
      [await fs.readFile(audioFilePath)],
      "test_audio.mp3",
      { type: "audio/mpeg" }
    );

    const result = await speechToText(
      audioFile,
      {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_1.id,
      },
      {
        returnWords: true,
      }
    );

    expect(result.text).toBeDefined();
    expect(result.words).toBeDefined();
    expect(Array.isArray(result.words)).toBeTruthy();
  });

  it("should throw an error with invalid model", async () => {
    const audioFile = new File(
      [await fs.readFile(audioFilePath)],
      "test_audio.mp3",
      { type: "audio/mpeg" }
    );

    await expect(
      speechToText(
        audioFile,
        {
          organisationId: TEST_ORGANISATION_1.id,
          userId: TEST_ORG1_USER_1.id,
        },
        {
          providerAndModelName: "openai:invalid-model",
        }
      )
    ).rejects.toThrow();
  });
});
