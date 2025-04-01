import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { getKnowledgeChunkById } from "./index";
import {
  initTests,
  TEST_ADMIN_USER,
  TEST_ORGANISATION_1,
  TEST_USER_1,
  TEST_ORGANISATION_2,
} from "../../../test/init.test";
import { getDb } from "../../../dbSchema";
import { knowledgeEntry, knowledgeChunks } from "../../db/schema/knowledge";
import { teamMembers, teams } from "../../db/schema/users";
import { eq } from "drizzle-orm";

beforeAll(async () => {
  await initTests();
});

describe("Knowledge Chunks CRUD Operations", () => {
  let testKnowledgeEntryId: string;
  let testKnowledgeChunkId: string;
  let testTeamId: string;

  beforeAll(async () => {
    // Create test knowledge entry
    const entry = await getDb()
      .insert(knowledgeEntry)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "Test Knowledge Entry",
        description: "Test description",
        sourceType: "text",
        userId: TEST_ADMIN_USER.id,
      })
      .returning();
    testKnowledgeEntryId = entry[0].id;

    // Create test knowledge chunk
    const chunk = await getDb()
      .insert(knowledgeChunks)
      .values({
        knowledgeEntryId: testKnowledgeEntryId,
        text: "Test chunk text",
        header: "Test header",
        order: 0,
        embeddingModel: "test-model",
        textEmbedding: new Array(1536).fill(0),
      })
      .returning();
    testKnowledgeChunkId = chunk[0].id;

    // Create test team
    const team = await getDb()
      .insert(teams)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "Test Team",
        description: "Test team description",
      })
      .returning();
    testTeamId = team[0].id;
  });

  describe("getKnowledgeChunkById", () => {
    test("should get a knowledge chunk by ID without user context", async () => {
      const result = await getKnowledgeChunkById(
        testKnowledgeChunkId,
        TEST_ORGANISATION_1.id
      );
      expect(result.id).toBe(testKnowledgeChunkId);
      expect(result.text).toBe("Test chunk text");
      expect(result.header).toBe("Test header");
    });

    test("should get a knowledge chunk by ID with admin user context", async () => {
      const result = await getKnowledgeChunkById(
        testKnowledgeChunkId,
        TEST_ORGANISATION_1.id,
        TEST_ADMIN_USER.id
      );
      expect(result.id).toBe(testKnowledgeChunkId);
      expect(result.text).toBe("Test chunk text");
    });

    test("should get a knowledge chunk by ID with team member context", async () => {
      // First add TEST_USER_1 to the team
      await getDb().insert(teamMembers).values({
        userId: TEST_USER_1.id,
        teamId: testTeamId,
      });

      // Update the knowledge entry to be team-based
      await getDb()
        .update(knowledgeEntry)
        .set({ teamId: testTeamId })
        .where(eq(knowledgeEntry.id, testKnowledgeEntryId));

      const result = await getKnowledgeChunkById(
        testKnowledgeChunkId,
        TEST_ORGANISATION_1.id,
        TEST_USER_1.id
      );
      expect(result.id).toBe(testKnowledgeChunkId);
      expect(result.text).toBe("Test chunk text");

      // Cleanup
      await getDb()
        .delete(teamMembers)
        .where(eq(teamMembers.userId, TEST_USER_1.id));
    });

    test("should throw error for non-existent chunk", async () => {
      const nonExistentId = "11111111-1111-1111-1111-111111111111";
      await expect(
        getKnowledgeChunkById(
          nonExistentId,
          TEST_ORGANISATION_1.id,
          TEST_ADMIN_USER.id
        )
      ).rejects.toThrow("Knowledge chunk not found");
    });

    test("should throw error for chunk from different organisation", async () => {
      // Create a chunk in a different organisation
      const otherOrgEntry = await getDb()
        .insert(knowledgeEntry)
        .values({
          organisationId: TEST_ORGANISATION_2.id,
          name: "Other Org Entry",
          description: "Test description",
          sourceType: "text",
        })
        .returning();

      const otherOrgChunk = await getDb()
        .insert(knowledgeChunks)
        .values({
          knowledgeEntryId: otherOrgEntry[0].id,
          text: "Other org chunk",
          header: "Other header",
          order: 0,
          embeddingModel: "test-model",
          textEmbedding: new Array(1536).fill(0),
        })
        .returning();

      try {
        await getKnowledgeChunkById(
          otherOrgChunk[0].id,
          TEST_ORGANISATION_1.id,
          TEST_ADMIN_USER.id
        );
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe("Knowledge chunk not found");
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    getDb()
      .delete(knowledgeChunks)
      .where(eq(knowledgeChunks.id, testKnowledgeChunkId));
    getDb()
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, testKnowledgeEntryId));
    getDb().delete(teams).where(eq(teams.id, testTeamId));
    console.log("afterAll");
  });
});
