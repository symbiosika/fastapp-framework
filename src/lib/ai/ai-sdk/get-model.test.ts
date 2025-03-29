import { describe, it, expect, beforeAll } from "bun:test";
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";
import { getAiSdkModel } from "./get-model";

describe("Knowledge Text Flow", () => {
  beforeAll(async () => {
    await initTests();
  });

  it("should return a valid model", async () => {
    const model = await getAiSdkModel("openai:gpt-4o", {
      organisationId: TEST_ORGANISATION_1.id,
    });
    expect(model).toBeDefined();
  });
});
