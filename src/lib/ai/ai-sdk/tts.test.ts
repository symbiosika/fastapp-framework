import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../test/init.test";
import { textToSpeech } from "./tts";
import fs from "fs/promises";

describe("Text to Speech", () => {
  let audioFilePath = "./test_audio.mp3";

  beforeAll(async () => {
    await initTests();
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(audioFilePath);
    } catch (error) {
      console.error("Error cleaning up test files:", error);
    }
  });
  it("should convert text to speech with default model", async () => {
    const text = "Hello, this is a test for text to speech.";
    const result = await textToSpeech(text, {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_USER_1.id,
    });

    expect(result.file).toBeDefined();
    expect(result.filename).toBeDefined();
    expect(result.model).toBeDefined();
    expect(result.model.startsWith("openai:")).toBeTruthy();

    // Save the file for STT tests
    await fs.writeFile(
      audioFilePath,
      Buffer.from(await result.file.arrayBuffer())
    );
  });

  it("should convert text to speech with specific model and voice", async () => {
    const text = "This is a test with a specific model and voice.";
    const result = await textToSpeech(
      text,
      {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      },
      {
        providerAndModelName: "openai:gpt-4o-mini-tts",
        voice: "alloy",
      }
    );

    expect(result.file).toBeDefined();
    expect(result.filename).toBeDefined();
    expect(result.model).toBe("openai:gpt-4o-mini-tts");
  });

  it("should throw an error with invalid model", async () => {
    const text = "This should fail.";
    await expect(
      textToSpeech(
        text,
        {
          organisationId: TEST_ORGANISATION_1.id,
          userId: TEST_USER_1.id,
        },
        {
          providerAndModelName: "openai:invalid-model",
          voice: "alloy",
        }
      )
    ).rejects.toThrow();
  });
});
