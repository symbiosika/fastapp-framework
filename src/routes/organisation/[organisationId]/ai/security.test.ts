import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../test/fetcher.test";
import defineRoutes from "./utils";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
} from "../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../types";
import { rejectUnauthorized } from "../../../../test/reject-unauthorized.test";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;
});

describe("AI Utils API Security Tests", () => {
  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`],
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`],
    ]);
  });

  test("User cannot access TTS in another organisation", async () => {
    // User 2 tries to access organisation 1's TTS endpoint
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_2_TOKEN,
      { text: "Hello, this is a test" }
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot access STT in another organisation", async () => {
    // Create a mock audio file
    const audioBlob = new Blob(["mock audio data"], { type: "audio/mp3" });
    const audioFile = new File([audioBlob], "test-audio.mp3", {
      type: "audio/mp3",
    });

    const body = new FormData();
    body.append("file", audioFile);

    // User 2 tries to access organisation 1's STT endpoint
    const response = await testFetcher.postFormData(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`,
      TEST_USER_2_TOKEN,
      body
    );

    // Should be rejected due to organisation permission check
    console.log(response.textResponse);
    expect(response.status).toBe(403);
  });

  test("Invalid organisation ID should be rejected", async () => {
    const invalidOrgId = "invalid-org-id";

    // Try to access TTS with invalid organisation ID
    const ttsResponse = await testFetcher.post(
      app,
      `/api/organisation/${invalidOrgId}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: "Hello, this is a test" }
    );

    // Should be rejected
    expect(ttsResponse.status).not.toBe(200);

    // Create a mock audio file
    const audioBlob = new Blob(["mock audio data"], { type: "audio/mp3" });
    const audioFile = new File([audioBlob], "test-audio.mp3", {
      type: "audio/mp3",
    });

    // Try to access STT with invalid organisation ID
    const sttResponse = await testFetcher.post(
      app,
      `/api/organisation/${invalidOrgId}/ai/utils/stt`,
      TEST_USER_1_TOKEN,
      { file: audioFile }
    );

    // Should be rejected
    expect(sttResponse.status).not.toBe(200);
  });

  test("Malicious input should be handled safely", async () => {
    // Test with potentially malicious text input
    const maliciousText = "<script>alert('XSS')</script>";

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: maliciousText }
    );

    // The API should handle this safely
    if (response.status === 200) {
      expect(response.headers.get("Content-Type")).toBe("audio/mp3");
    } else {
      expect(response.status).toBe(400);
    }
  });

  test("User can access their own organisation's endpoints", async () => {
    // User 2 accesses their own organisation's TTS endpoint
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_2.id}/ai/utils/tts`,
      TEST_USER_2_TOKEN,
      { text: "Hello, this is a test" }
    );

    // Should be allowed
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mp3");
  });
});
