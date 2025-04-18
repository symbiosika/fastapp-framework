import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
  TEST_ORGANISATION_3,
  TEST_USER_1,
} from "../../../../../test/init.test";
import { avatars } from "../../../../../dbSchema";
import { inArray } from "drizzle-orm";
import { getDb } from "../../../../../lib/db/db-connection";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineAvatarRoutes from ".";
import type { FastAppHono } from "../../../../../types";

let TEST_USER_TOKEN: string;

// Initialize the app and define routes
const app: FastAppHono = new Hono();
defineAvatarRoutes(app, "/api");

// Test suite for avatar endpoints
describe("Avatar API Endpoints", () => {
  beforeAll(async () => {
    const { user1Token } = await initTests();
    TEST_USER_TOKEN = user1Token;

    await getDb()
      .delete(avatars)
      .where(
        inArray(avatars.organisationId, [
          TEST_ORGANISATION_1.id,
          TEST_ORGANISATION_2.id,
          TEST_ORGANISATION_3.id,
        ])
      );
  });

  it("should create a new avatar successfully", async () => {
    const avatarData = {
      name: "Test Avatar",
      description: "Test Description",
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_USER_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars`,
      TEST_USER_TOKEN,
      avatarData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.name).toBe(avatarData.name);
    expect(response.jsonResponse.description).toBe(avatarData.description);
  });

  it("should list avatars successfully", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars`,
      TEST_USER_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(Array.isArray(response.jsonResponse)).toBe(true);
  });

  it("should update an avatar successfully", async () => {
    // First create an avatar to update
    const createResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars`,
      TEST_USER_TOKEN,
      {
        name: "Original Avatar",
        description: "Original Description",
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      }
    );

    const avatarId = createResponse.jsonResponse.id;
    const updateData = {
      name: "Updated Avatar",
      description: "Updated Description",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars/${avatarId}`,
      TEST_USER_TOKEN,
      updateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.name).toBe(updateData.name);
    expect(response.jsonResponse.description).toBe(updateData.description);
  });

  it("should delete an avatar successfully", async () => {
    // First create an avatar to delete
    const createResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars`,
      TEST_USER_TOKEN,
      {
        name: "Avatar to Delete",
        description: "Will be deleted",
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      }
    );

    const avatarId = createResponse.jsonResponse.id;

    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars/${avatarId}`,
      TEST_USER_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  it("should handle invalid avatar creation", async () => {
    const invalidAvatarData = {
      name: "", // Invalid empty name
      description: "Test Description",
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_USER_1.id,
    };

    try {
      await testFetcher.post(
        app,
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars`,
        TEST_USER_TOKEN,
        invalidAvatarData
      );
    } catch (e: any) {
      expect(e.status).toBe(400);
    }
  });

  it("should handle non-existent avatar update", async () => {
    const updateData = {
      name: "Updated Avatar",
      description: "Updated Description",
    };

    try {
      await testFetcher.put(
        app,
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars/non-existent-id`,
        TEST_USER_TOKEN,
        updateData
      );
    } catch (e: any) {
      expect(e.status).toBe(404);
    }
  });

  it("should handle non-existent avatar deletion", async () => {
    try {
      await testFetcher.delete(
        app,
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/avatars/non-existent-id`,
        TEST_USER_TOKEN
      );
    } catch (e: any) {
      expect(e.status).toBe(404);
    }
  });
});
