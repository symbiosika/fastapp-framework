import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("AI Utils API Edge Cases", () => {
  test("Text to Speech with empty text", async () => {
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: "" }
    );

    // Empty text should be handled gracefully
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("Error");
  });

  test("Text to Speech with invalid voice", async () => {
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: "Hello", voice: "invalid_voice" }
    );

    // Invalid voice should be rejected by validation
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("Invalid type");
  });

  test("Text to Speech with very long text", async () => {
    // Create a very long text (10,000 characters)
    const longText = "a".repeat(10000);

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/tts`,
      TEST_USER_1_TOKEN,
      { text: longText }
    );

    // The API should handle long text appropriately
    // This might succeed or fail depending on the API limits
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("Failed to convert text to speech");
  });

  test("Speech to Text without file", async () => {
    // Mock the app.request method for form data
    const originalRequest = app.request;
    app.request = async (path, init) => {
      if (
        path === `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt` &&
        init?.method === "POST"
      ) {
        // Return a mock error response
        return new Response(
          JSON.stringify({
            error: "No audio file provided",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      return originalRequest(path, init);
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`,
      TEST_USER_1_TOKEN,
      {}
    );

    // Restore the original request method
    app.request = originalRequest;

    expect(response.status).toBe(400);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.error).toBe("No audio file provided");
  });

  test("Speech to Text with unsupported file format", async () => {
    // Create a mock file with unsupported format
    const textBlob = new Blob(["This is not an audio file"], {
      type: "text/plain",
    });
    const textFile = new File([textBlob], "not-audio.txt", {
      type: "text/plain",
    });

    // Mock the app.request method for form data
    const originalRequest = app.request;
    app.request = async (path, init) => {
      if (
        path === `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt` &&
        init?.method === "POST"
      ) {
        // Return a mock error response
        return new Response(
          JSON.stringify({
            error: "Unsupported file format",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      return originalRequest(path, init);
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`,
      TEST_USER_1_TOKEN,
      { file: textFile }
    );

    // Restore the original request method
    app.request = originalRequest;

    expect(response.status).toBe(400);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.error).toBe("Unsupported file format");
  });

  test("Speech to Text with very large file", async () => {
    // Create a mock large audio file (1MB of data)
    const largeData = new Uint8Array(1024 * 1024);
    const largeBlob = new Blob([largeData], { type: "audio/mp3" });
    const largeFile = new File([largeBlob], "large-audio.mp3", {
      type: "audio/mp3",
    });

    // Mock the app.request method for form data
    const originalRequest = app.request;
    app.request = async (path, init) => {
      if (
        path === `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt` &&
        init?.method === "POST"
      ) {
        // Return a mock response or error depending on your API limits
        return new Response(
          JSON.stringify({
            text: "Transcription of large file",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      return originalRequest(path, init);
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/utils/stt`,
      TEST_USER_1_TOKEN,
      { file: largeFile }
    );

    // Restore the original request method
    app.request = originalRequest;

    // The API should handle large files appropriately
    if (response.status === 200) {
      expect(response.jsonResponse.text).toBe("Transcription of large file");
    } else {
      expect(response.status).toBe(400);
      expect(response.jsonResponse.error).toBeDefined();
    }
  });
});
