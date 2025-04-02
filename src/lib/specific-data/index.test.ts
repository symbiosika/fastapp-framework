import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ADMIN_USER,
  TEST_ORGANISATION_1,
  TEST_USER_1,
  TEST_TEAM_1,
} from "../../test/init.test";
import {
  createUserSpecificData,
  getUserSpecificData,
  getUserSpecificDataByKey,
  updateUserSpecificData,
  deleteUserSpecificData,
  createAppSpecificData,
  getAppSpecificData,
  getAppSpecificDataByKey,
  updateAppSpecificData,
  deleteAppSpecificData,
  createOrganisationSpecificData,
  getOrganisationSpecificData,
  getOrganisationSpecificDataByFilter,
  updateOrganisationSpecificData,
  deleteOrganisationSpecificData,
  createTeamSpecificData,
  getTeamSpecificData,
  getTeamSpecificDataByKey,
  getTeamSpecificDataByFilter,
  updateTeamSpecificData,
  deleteTeamSpecificData,
} from "./index";

beforeAll(async () => {
  await initTests();
});

describe("User Specific Data", () => {
  const testData = {
    key: "test-key",
    data: "test-value",
    userId: TEST_USER_1.id,
  };

  test("should create and retrieve user specific data", async () => {
    const created = await createUserSpecificData(TEST_USER_1.id, testData);
    expect(created).toBeDefined();
    expect(created.userId).toBe(TEST_USER_1.id);
    expect(created.key).toBe(testData.key);
    expect(created.data).toBe(testData.data);

    const retrieved = await getUserSpecificData(created.id, TEST_USER_1.id);
    expect(retrieved).toEqual(created);
  });

  test("should get user specific data by key", async () => {
    const data = await getUserSpecificDataByKey(TEST_USER_1.id, testData.key);
    expect(data).toBeDefined();
    expect(data.key).toBe(testData.key);
  });

  test("should update user specific data", async () => {
    const created = await createUserSpecificData(TEST_USER_1.id, {
      ...testData,
      key: "update-key",
    });
    const updated = await updateUserSpecificData(created.id, TEST_USER_1.id, {
      data: "updated-value",
    });
    expect(updated.data).toBe("updated-value");
  });

  test("should delete user specific data", async () => {
    const created = await createUserSpecificData(TEST_USER_1.id, {
      ...testData,
      key: "delete-key",
    });
    await deleteUserSpecificData(created.id, TEST_USER_1.id);

    try {
      await getUserSpecificData(created.id, TEST_USER_1.id);
      expect(true).toBe(false); // Should not reach here
    } catch (e: any) {
      expect(e.message).toBe("User specific data not found");
    }
  });
});

describe("App Specific Data", () => {
  const testData = {
    key: "test-key",
    name: "test-app",
    data: "test-value",
  };

  test("should create and retrieve app specific data", async () => {
    const created = await createAppSpecificData(testData);
    expect(created).toBeDefined();
    expect(created.key).toBe(testData.key);
    expect(created.name).toBe(testData.name);
    expect(created.data).toBe(testData.data);

    const retrieved = await getAppSpecificData(created.id);
    expect(retrieved).toEqual(created);
  });

  test("should get app specific data by key", async () => {
    const data = await getAppSpecificDataByKey(testData.key, testData.name);
    expect(data).toBeDefined();
    expect(data.key).toBe(testData.key);
  });

  test("should update app specific data", async () => {
    const created = await createAppSpecificData({
      ...testData,
      key: "update-key",
    });
    const updated = await updateAppSpecificData(created.id, {
      data: "updated-value",
    });
    expect(updated.data).toBe("updated-value");
  });

  test("should delete app specific data", async () => {
    const created = await createAppSpecificData({
      ...testData,
      key: "delete-key",
    });
    await deleteAppSpecificData(created.id);

    try {
      await getAppSpecificData(created.id);
      expect(true).toBe(false); // Should not reach here
    } catch (e: any) {
      expect(e.message).toBe("App specific data not found");
    }
  });
});

describe("Organisation Specific Data", () => {
  const testData = {
    category: "test-category",
    name: "test-name",
    data: "test-value",
  };

  test("should create and retrieve organisation specific data", async () => {
    const created = await createOrganisationSpecificData(testData);
    expect(created).toBeDefined();
    expect(created.category).toBe(testData.category);
    expect(created.name).toBe(testData.name);
    expect(created.data).toBe(testData.data);

    const retrieved = await getOrganisationSpecificData(created.id);
    expect(retrieved).toEqual(created);
  });

  test("should get organisation specific data by filter", async () => {
    const data = await getOrganisationSpecificDataByFilter(testData.category);
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].category).toBe(testData.category);
  });

  test("should update organisation specific data", async () => {
    const created = await createOrganisationSpecificData({
      ...testData,
      name: "update-name",
    });
    const updated = await updateOrganisationSpecificData(created.id, {
      data: "updated-value",
    });
    expect(updated.data).toBe("updated-value");
  });

  test("should delete organisation specific data", async () => {
    const created = await createOrganisationSpecificData({
      ...testData,
      name: "delete-name",
    });
    await deleteOrganisationSpecificData(created.id);

    try {
      await getOrganisationSpecificData(created.id);
      expect(true).toBe(false); // Should not reach here
    } catch (e: any) {
      expect(e.message).toBe("Organisation specific data not found");
    }
  });
});

describe("Team Specific Data", () => {
  const testData = {
    teamId: TEST_TEAM_1.id,
    category: "test-category",
    key: "test-key",
    data: "test-value",
  };

  test("should create and retrieve team specific data", async () => {
    const created = await createTeamSpecificData(testData);
    expect(created).toBeDefined();
    expect(created.teamId).toBe(testData.teamId);
    expect(created.category).toBe(testData.category);
    expect(created.key).toBe(testData.key);
    expect(created.data).toBe(testData.data);

    const retrieved = await getTeamSpecificData(created.id);
    expect(retrieved).toEqual(created);
  });

  test("should get team specific data by key", async () => {
    const data = await getTeamSpecificDataByKey(
      testData.teamId,
      testData.category,
      testData.key
    );
    expect(data).toBeDefined();
    expect(data.key).toBe(testData.key);
  });

  test("should get team specific data by filter", async () => {
    const data = await getTeamSpecificDataByFilter(
      testData.teamId,
      testData.category
    );
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].category).toBe(testData.category);
  });

  test("should update team specific data", async () => {
    const created = await createTeamSpecificData({
      ...testData,
      key: "update-key",
    });
    const updated = await updateTeamSpecificData(created.id, {
      data: "updated-value",
    });
    expect(updated.data).toBe("updated-value");
  });

  test("should delete team specific data", async () => {
    const created = await createTeamSpecificData({
      ...testData,
      key: "delete-key",
    });
    await deleteTeamSpecificData(created.id);

    try {
      await getTeamSpecificData(created.id);
      expect(true).toBe(false); // Should not reach here
    } catch (e: any) {
      expect(e.message).toBe("Team specific data not found");
    }
  });
});
