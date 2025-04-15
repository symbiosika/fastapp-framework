import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import { initTests, TEST_ORGANISATION_1 } from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let savedTTSAudio: File | undefined;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("AI Utils API Endpoints", () => {
  test("Text to Speech endpoint", async () => {
    // Create a simple text to speech request
    const response = await testFetcher.postWithPlainResponse(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: "Hello, this is a test" }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mp3");
    expect(response.headers.get("Content-Disposition")).toContain(
      "attachment; filename="
    );
  }, 15000);

  test("Text to Speech with custom voice", async () => {
    // Test with a specific voice
    const response = await testFetcher.postWithPlainResponse(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: "Hello, this is a test", voice: "nova" }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mp3");
    expect(response.headers.get("Content-Disposition")).toContain(
      "attachment; filename="
    );

    // Save the audio response for use in STT tests
    const audioBuffer = await response.arrayBuffer();
    const savedAudioBlob = new Blob([audioBuffer], { type: "audio/mp3" });
    const savedAudioFile = new File([savedAudioBlob], "tts-output.mp3", {
      type: "audio/mp3",
    });

    // Store for later tests
    savedTTSAudio = savedAudioFile;
  }, 15000);

  test("Speech to Text endpoint", async () => {
    expect(savedTTSAudio).toBeDefined();
    if (!savedTTSAudio) {
      throw new Error("Saved TTS audio is not defined");
    }

    // Create form data with proper boundary
    const formData = new FormData();
    formData.append("file", savedTTSAudio, "audio.mp3"); // Add filename explicitly

    const response = await testFetcher.postFormData(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`,
      TEST_USER_1_TOKEN,
      formData
    );
    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.text).toContain("Hello, this is a test");
  }, 15000);

  test("Speech to Text with segments", async () => {
    expect(savedTTSAudio).toBeDefined();
    if (!savedTTSAudio) {
      throw new Error("Saved TTS audio is not defined");
    }

    // Create form data with proper boundary
    const formData = new FormData();
    formData.append("file", savedTTSAudio, "audio.mp3"); // Add filename explicitly
    formData.append("returnSegments", "true");

    const response = await testFetcher.postFormData(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`,
      TEST_USER_1_TOKEN,
      formData
    );

    // const resultDemo = {
    //   task: "transcribe",
    //   language: "english",
    //   duration: 1.2400000095367432,
    //   text: "Hello, this is a test.",
    //   segments: [
    //     {
    //       id: 0,
    //       seek: 0,
    //       start: 0,
    //       end: 2,
    //       text: " Hello, this is a test.",
    //       tokens: [50364, 2425, 11, 341, 307, 257, 1500, 13, 50464],
    //       temperature: 0,
    //       avg_logprob: -0.3923383057117462,
    //       compression_ratio: 0.7857142686843872,
    //       no_speech_prob: 0.010280896909534931,
    //     },
    //   ],
    // };

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.text).toContain("Hello, this is a test");
    expect(response.jsonResponse.segments).toBeDefined();
    expect(response.jsonResponse.segments.length).toBe(1);
  }, 15000);
});
