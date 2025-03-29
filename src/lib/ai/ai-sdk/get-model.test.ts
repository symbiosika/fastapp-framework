import { describe, it, expect, beforeAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../test/init.test";
import { getAIModel, getAIEmbeddingModel } from "./get-model";

describe("Knowledge Text Flow", () => {
  beforeAll(async () => {
    await initTests();
  });

  it("should return a valid model", async () => {
    const model = await getAIModel("openai:gpt-4o-mini", {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_USER_1.id,
    });
    expect(model).toBeDefined();
  });

  it("should throw an error if the model is not found", async () => {
    await expect(
      getAIModel("openai:gpt-4o-mini-not-found", {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      })
    ).rejects.toThrow();
  });

  it("should throw an error for a custom model without API key", async () => {
    process.env.IONOS_API_KEY = "";
    await expect(
      getAIModel("ionos:llama-3.1-8b-instruct", {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      })
    ).rejects.toThrow("API key for ionos is not set in environment variables");
  });

  it("should return a valid embedding model", async () => {
    const embeddingModel = await getAIEmbeddingModel(
      "openai:text-embedding-3-small",
      {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_USER_1.id,
      }
    );
    expect(embeddingModel).toBeDefined();
  });
});
