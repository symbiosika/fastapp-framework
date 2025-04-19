import { describe, test, expect, beforeAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
  TEST_ORG1_USER_1,
  TEST_ORG2_USER_1,
} from "../../../test/init.test";
import {
  createAvatar,
  getAvatarByName,
  listAvatars,
  updateAvatar,
  deleteAvatar,
  getAvatarForChat,
} from "./index";
import type { AvatarInsert } from "../../db/db-schema";

beforeAll(async () => {
  await initTests();
});

describe("Avatar Module Tests", () => {
  const testAvatar: AvatarInsert = {
    name: "Test Avatar",
    description: "This is a test avatar",
    organisationId: TEST_ORGANISATION_1.id,
    userId: TEST_ORG1_USER_1.id,
  };

  const testOrgWideAvatar: AvatarInsert = {
    name: "Org Wide Avatar",
    description: "This is an organization-wide avatar",
    organisationId: TEST_ORGANISATION_1.id,
    userId: TEST_ORG1_USER_1.id,
    organisationWide: true,
  };

  let createdOrgWideAvatar: any;

  test("createAvatar - should create a new avatar", async () => {
    const avatar = await createAvatar(testAvatar);
    expect(avatar).toBeDefined();
    expect(avatar.name).toBe(testAvatar.name);
    expect(avatar.description).toBe(testAvatar.description);
    expect(avatar.organisationId).toBe(testAvatar.organisationId);
    expect(avatar.userId).toBe(testAvatar.userId);
  });

  test("createAvatar - should create an organization-wide avatar", async () => {
    createdOrgWideAvatar = await createAvatar(testOrgWideAvatar);
    expect(createdOrgWideAvatar).toBeDefined();
    expect(createdOrgWideAvatar.name).toBe(testOrgWideAvatar.name);
    expect(createdOrgWideAvatar.organisationWide).toBe(true);
  });

  test("getAvatarByName - should return avatar by name", async () => {
    const avatar = await getAvatarByName(
      TEST_ORGANISATION_1.id,
      testAvatar.name,
      { userId: TEST_ORG1_USER_1.id }
    );
    expect(avatar).toBeDefined();
    expect(avatar.name).toBe(testAvatar.name);
  });

  test("getAvatarByName - should return organization-wide avatar for any user", async () => {
    const avatar = await getAvatarByName(
      TEST_ORGANISATION_1.id,
      testOrgWideAvatar.name,
      { userId: TEST_ORG2_USER_1.id }
    );
    expect(avatar).toBeDefined();
    expect(avatar.name).toBe(testOrgWideAvatar.name);
    expect(avatar.organisationWide).toBe(true);
  });

  test("getAvatarByName - should throw error for non-existent avatar", async () => {
    try {
      await getAvatarByName(TEST_ORGANISATION_1.id, "NonExistentAvatar", {
        userId: TEST_ORG1_USER_1.id,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("Avatar not found");
    }
  });

  test("listAvatars - should return all avatars for an organization", async () => {
    const avatars = await listAvatars(TEST_ORGANISATION_1.id, {
      userId: TEST_ORG1_USER_1.id,
    });
    expect(Array.isArray(avatars)).toBe(true);
    expect(avatars.length).toBeGreaterThan(0);
    expect(avatars[0].organisationId).toBe(TEST_ORGANISATION_1.id);
  });

  test("listAvatars - should return organization-wide avatars for any user", async () => {
    const avatars = await listAvatars(TEST_ORGANISATION_1.id, {
      userId: TEST_ORG2_USER_1.id,
    });
    expect(Array.isArray(avatars)).toBe(true);
    const orgWideAvatars = avatars.filter((a) => a.organisationWide);
    expect(orgWideAvatars.length).toBeGreaterThan(0);
    expect(orgWideAvatars[0].name).toBe(testOrgWideAvatar.name);
  });

  test("updateAvatar - should update avatar details", async () => {
    const avatar = await getAvatarByName(
      TEST_ORGANISATION_1.id,
      testAvatar.name,
      { userId: TEST_ORG1_USER_1.id }
    );
    const updatedData = {
      description: "Updated description",
    };
    const updatedAvatar = await updateAvatar(avatar.id, updatedData, {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
    });
    expect(updatedAvatar).toBeDefined();
    expect(updatedAvatar?.description).toBe(updatedData.description);
  });

  test("updateAvatar - should allow admin to update organization-wide avatar", async () => {
    const updatedData = {
      description: "Updated organization-wide description",
    };
    const updatedAvatar = await updateAvatar(
      createdOrgWideAvatar.id,
      updatedData,
      {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_1.id,
      }
    );
    expect(updatedAvatar).toBeDefined();
    expect(updatedAvatar?.description).toBe(updatedData.description);
  });

  test("deleteAvatar - should delete an avatar", async () => {
    const avatar = await getAvatarByName(
      TEST_ORGANISATION_1.id,
      testAvatar.name,
      { userId: TEST_ORG1_USER_1.id }
    );
    const result = await deleteAvatar(avatar.id, {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
    });
    expect(result).toBe(true);

    // Verify avatar is deleted
    try {
      await getAvatarByName(TEST_ORGANISATION_1.id, testAvatar.name, {
        userId: TEST_ORG1_USER_1.id,
      });
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("Avatar not found");
    }
  });

  test("getAvatarForChat - should convert avatar to chat message", async () => {
    // Create a new avatar for this test
    const newAvatar = await createAvatar({
      name: "Chat Avatar",
      description: "This is a chat avatar",
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_ORG1_USER_1.id,
    });

    const chatMessage = await getAvatarForChat(
      TEST_ORG1_USER_1.id,
      TEST_ORGANISATION_1.id,
      newAvatar.name
    );
    expect(chatMessage).toBeDefined();
    expect(chatMessage.role).toBe("assistant");
    expect(chatMessage.content).toBe(newAvatar.description);
  });
});
