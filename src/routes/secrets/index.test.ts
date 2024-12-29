import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import defineManageSecretsRoutes from ".";
import type { FastAppHono } from "../../types";
import { initTests, TEST_ORGANISATION_ID } from "../../test/init.test";

describe("Secrets API Endpoints", () => {
  const app: FastAppHono = new Hono();
  let jwt: string;

  beforeAll(async () => {
    const { token } = await initTests();
    jwt = token;
    defineManageSecretsRoutes(app, "/api");
  });

  // Test getting secrets
  it("should get all secrets", async () => {
    const response = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // Test setting a new secret
  it("should set a new secret", async () => {
    const secretData = {
      name: "TEST_SECRET",
      value: "test_value_123",
    };

    const response = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}`,
      {
        method: "POST",
        body: JSON.stringify(secretData),
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("TEST_SECRET");
  });

  // Test deleting a secret
  it("should delete a secret", async () => {
    // First create a secret to delete
    const secretData = {
      name: "SECRET_TO_DELETE",
      value: "delete_me",
    };

    const createResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}`,
      {
        method: "POST",
        body: JSON.stringify(secretData),
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(createResponse.status).toBe(200);

    // Now delete the secret
    const deleteResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}/SECRET_TO_DELETE`,
      {
        method: "DELETE",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(deleteResponse.status).toBe(200);

    // Verify the secret is deleted by trying to fetch it
    const verifyResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}/SECRET_TO_DELETE`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(verifyResponse.status).toBe(404);
  });

  // Test error cases
  it("should handle invalid requests", async () => {
    // Test unauthorized access
    const unauthorizedResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}`,
      {
        method: "GET",
      }
    );
    expect(unauthorizedResponse.status).toBe(401);

    // Test invalid secret data
    const invalidSecretResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}`,
      {
        method: "POST",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      }
    );
    expect(invalidSecretResponse.status).toBe(400);

    // Test invalid secret data format
    const invalidFormatResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}`,
      {
        method: "POST",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
        body: JSON.stringify({
          name: 123, // Should be string
          value: true, // Should be string
        }),
      }
    );
    expect(invalidFormatResponse.status).toBe(400);

    // Test deleting non-existent secret
    const nonExistentResponse = await app.request(
      `/api/secrets/organisation/${TEST_ORGANISATION_ID}/NON_EXISTENT_SECRET`,
      {
        method: "DELETE",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(nonExistentResponse.status).toBe(200);
  });
});
