import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ORG1_USER_1,
  TEST_ORG1_USER_2,
  TEST_ORG2_USER_1,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
} from "../../../test/init.test";
import {
  testing_createTeamAndAddUsers,
  testing_deleteTeam,
  testing_createWorkspace,
  testing_deleteWorkspace,
  testing_createKnowledgeEntry,
} from "../../../test/permissions.test";
import { getKnowledgeEntries } from "./get-knowledge";
import type { KnowledgeEntrySelect } from "../../db/db-schema";

describe("getKnowledgeEntries Permissions", () => {
  let teamIdOrg1: string;
  let workspaceIdOrg1: string;
  let teamIdOrg2: string;
  let workspaceIdOrg2: string;

  beforeAll(async () => {
    await initTests();

    // Create a team and workspace in Organisation1, add TEST_ORG1_USER_1 to that team
    const teamOrg1 = await testing_createTeamAndAddUsers(
      TEST_ORGANISATION_1.id,
      [TEST_ORG1_USER_1.id]
    );
    teamIdOrg1 = teamOrg1.teamId;
    const workspaceOrg1 = await testing_createWorkspace({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      teamId: teamIdOrg1,
    });
    workspaceIdOrg1 = workspaceOrg1.id;

    // Create a team and workspace in Organisation2, add TEST_ORG1_USER_2 to that team
    const teamOrg2 = await testing_createTeamAndAddUsers(
      TEST_ORGANISATION_2.id,
      [TEST_ORG1_USER_2.id]
    );
    teamIdOrg2 = teamOrg2.teamId;
    const workspaceOrg2 = await testing_createWorkspace({
      organisationId: TEST_ORGANISATION_2.id,
      userId: TEST_ORG1_USER_2.id,
      teamId: teamIdOrg2,
    });
    workspaceIdOrg2 = workspaceOrg2.id;
  });

  afterAll(() => {
    // Clean up teams and workspaces
    // await testing_deleteTeam([teamIdOrg1, teamIdOrg2]);
    testing_deleteWorkspace([workspaceIdOrg1, workspaceIdOrg2]).then(() => {});
  });

  let entryOrg1: KnowledgeEntrySelect;
  test("User can read knowledge from the team & workspace they belong to", async () => {
    // Create an entry in org1, with teamIdOrg1 and workspaceIdOrg1, userOwned = false
    entryOrg1 = await testing_createKnowledgeEntry({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      workspaceId: workspaceIdOrg1,
    });

    // Should succeed for user1 from org1
    const result1 = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      workspaceId: workspaceIdOrg1,
    });
    expect(result1.length).toBeGreaterThanOrEqual(1);
    expect(result1.find((r) => r.id === entryOrg1.id)).toBeDefined();
  });

  test("User in a different org should not see others' org knowledge", async () => {
    // Attempt to query org1 knowledge with user2 (belongs to org2)
    expect(async () => {
      const result = await getKnowledgeEntries({
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG2_USER_1.id,
        teamId: teamIdOrg1,
        workspaceId: workspaceIdOrg1,
      });
    }).toThrow();
  });

  test("User-owned knowledge is only visible to that specific user", async () => {
    // Create an entry with userOwned = true for TEST_ORG1_USER_1
    const entryOwned = await testing_createKnowledgeEntry({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      userOwned: true,
    });

    // Visible to the same user
    const result1 = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      userOwned: true,
    });
    expect(result1.find((r) => r.id === entryOwned.id)).toBeDefined();

    // Should NOT be visible to another user
    const result2 = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_2.id,
      userOwned: true,
    });
    // If we get this far, user2 wrongly saw user1's userOwned entry
    expect(result2.find((r) => r.id === entryOwned.id)).toBeUndefined();
  });

  let entryInTeam1InOrg1: KnowledgeEntrySelect;
  test("Users cannot read knowledge from teams they do not belong to: create", async () => {
    // Create an entry in org2, with teamIdOrg2, workspaceIdOrg2
    entryInTeam1InOrg1 = await testing_createKnowledgeEntry({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG2_USER_1.id,
      teamId: teamIdOrg1,
    });
  });

  test("Users cannot read knowledge from teams they do not belong to: read (user1)", async () => {
    // user1 should see it
    const result1 = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      teamId: teamIdOrg1,
    });
    expect(result1.find((r) => r.id === entryInTeam1InOrg1.id)).toBeDefined();
  });

  test("Users cannot read knowledge from teams they do not belong to: read (user2)", async () => {
    // user2 should not see it
    expect(async () => {
      await getKnowledgeEntries({
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_2.id,
        teamId: teamIdOrg1,
      });
    }).toThrow();
  });

  test("User can access knowledge entries in workspaces they have access to: create", async () => {
    // Create a knowledge entry in workspace1 in org1
    const entryInWorkspace = await testing_createKnowledgeEntry({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      workspaceId: workspaceIdOrg1,
    });

    // User1 should be able to access it
    const result = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      workspaceId: workspaceIdOrg1,
    });
    expect(result.find((r) => r.id === entryInWorkspace.id)).toBeDefined();
  });

  let entryInWorkspace: KnowledgeEntrySelect;
  test("User cannot access knowledge entries in workspaces they don't have access to: create (user1)", async () => {
    // Create a knowledge entry in the workspace
    entryInWorkspace = await testing_createKnowledgeEntry({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      workspaceId: workspaceIdOrg1,
    });
  });

  test("User cannot access knowledge entries in workspaces they don't have access to: read (user2)", async () => {
    // User2 should not be able to access it
    expect(async () => {
      await getKnowledgeEntries({
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_2.id,
        workspaceId: workspaceIdOrg1,
      });
    }).toThrow();
  });

  let entryWithFilters: KnowledgeEntrySelect;
  test("User can create knowledge entries with filters", async () => {
    entryWithFilters = await testing_createKnowledgeEntry({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      teamId: teamIdOrg1,
      filters: {
        "test-case": "test-1",
      },
    });
  });

  test("User can read knowledge entries with filters", async () => {
    const result = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      teamId: teamIdOrg1,
      filterNames: {
        "test-case": ["test-1", "test-2"],
      },
    });
    expect(result.find((r) => r.id === entryWithFilters.id)).toBeDefined();
  });

  test("User canot read knowledge entries with wrong filters", async () => {
    const result = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      teamId: teamIdOrg1,
      filterNames: {
        "test-case": ["test-3", "test-4"],
      },
    });
    expect(result.find((r) => r.id === entryWithFilters.id)).toBeUndefined();
  });

  test("User canot read knowledge entries with wrong filters again", async () => {
    const result = await getKnowledgeEntries({
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
      teamId: teamIdOrg1,
      filterNames: {
        "test-some-else": ["test"],
      },
    });
    expect(result.find((r) => r.id === entryWithFilters.id)).toBeUndefined();
  });
});
