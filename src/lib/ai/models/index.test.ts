import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ADMIN_USER,
  TEST_ORGANISATION_1,
  TEST_ORG1_USER_1,
  TEST_ORGANISATION_2,
} from "../../../test/init.test";
import {
  getAllAiProviderModels,
  getAiProviderModelById,
  createAiProviderModel,
  updateAiProviderModel,
  deleteAiProviderModel,
  getAvailableApiKeys,
} from "./index";

beforeAll(async () => {
  await initTests();
});

describe("AI Models", () => {
  describe("getAvailableApiKeys", () => {
    test("should return available API keys", () => {
      const keys = getAvailableApiKeys();
      expect(keys).toBeDefined();
      expect(typeof keys).toBe("object");
      expect(Object.keys(keys)).toContain("openai");
      expect(Object.keys(keys)).toContain("anthropic");
      expect(Object.keys(keys)).toContain("groq");
    });
  });

  describe("getAllAiProviderModels", () => {
    test("should get all AI provider models for an organisation", async () => {
      const models = await getAllAiProviderModels(TEST_ORGANISATION_1.id);
      expect(Array.isArray(models)).toBe(true);
    });

    test("should handle non-existent organisation", async () => {
      try {
        await getAllAiProviderModels("non-existent-id");
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe("getAiProviderModelById", () => {
    test("should get a single AI provider model", async () => {
      // First create a model to test with
      const modelData = {
        organisationId: TEST_ORGANISATION_1.id,
        name: "test-model",
        model: "gpt-3.5-turbo",
        provider: "openai",
        description: "Test model",
        inputType: ["text" as const],
        outputType: ["text" as const],
        label: "Test Model",
        maxTokens: 4096,
        maxOutputTokens: 2048,
        endpoint: "https://api.openai.com/v1",
        hostingOrigin: "openai",
        usesInternet: true,
        active: true,
        system: false,
        showInfoBanner: false,
        infoBannerText: "",
        infoBannerColor: "",
        endpointCompatibility: "openai" as const
      };

      const createdModel = await createAiProviderModel(modelData);
      const model = await getAiProviderModelById(
        TEST_ORGANISATION_1.id,
        createdModel.id
      );

      expect(model).toBeDefined();
      expect(model.id).toBe(createdModel.id);
      expect(model.name).toBe("test-model");
    });

    test("should handle non-existent model", async () => {
      try {
        await getAiProviderModelById(
          TEST_ORGANISATION_1.id,
          "non-existent-id"
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe("createAiProviderModel", () => {
    test("should create a new AI provider model", async () => {
      const modelData = {
        organisationId: TEST_ORGANISATION_1.id,
        name: "test-model-2",
        model: "gpt-3.5-turbo",
        provider: "openai",
        description: "Test model 2",
        inputType: ["text" as const],
        outputType: ["text" as const],
        label: "Test Model 2",
        maxTokens: 4096,
        maxOutputTokens: 2048,
        endpoint: "https://api.openai.com/v1",
        hostingOrigin: "openai",
        usesInternet: true,
        active: true,
        system: false,
        showInfoBanner: false,
        infoBannerText: "",
        infoBannerColor: "",
        endpointCompatibility: "openai" as const
      };

      const model = await createAiProviderModel(modelData);
      expect(model).toBeDefined();
      expect(model.name).toBe("test-model-2");
      expect(model.organisationId).toBe(TEST_ORGANISATION_1.id);
    });

    test("should handle duplicate model creation", async () => {
      const modelData = {
        organisationId: TEST_ORGANISATION_1.id,
        name: "test-model-3",
        model: "gpt-3.5-turbo",
        provider: "openai",
        description: "Test model 3",
        inputType: ["text" as const],
        outputType: ["text" as const],
        label: "Test Model 3",
        maxTokens: 4096,
        maxOutputTokens: 2048,
        endpoint: "https://api.openai.com/v1",
        hostingOrigin: "openai",
        usesInternet: true,
        active: true,
        system: false,
        showInfoBanner: false,
        infoBannerText: "",
        infoBannerColor: "",
        endpointCompatibility: "openai" as const
      };

      const model1 = await createAiProviderModel(modelData);
      const model2 = await createAiProviderModel(modelData);

      // Should update existing model instead of creating new one
      expect(model2.id).toBe(model1.id);
    });
  });

  describe("updateAiProviderModel", () => {
    test("should update an existing AI provider model", async () => {
      // First create a model to update
      const modelData = {
        organisationId: TEST_ORGANISATION_1.id,
        name: "test-model-4",
        model: "gpt-3.5-turbo",
        provider: "openai",
        description: "Test model 4",
        inputType: ["text" as const],
        outputType: ["text" as const],
        label: "Test Model 4",
        maxTokens: 4096,
        maxOutputTokens: 2048,
        endpoint: "https://api.openai.com/v1",
        hostingOrigin: "openai",
        usesInternet: true,
        active: true,
        system: false,
        showInfoBanner: false,
        infoBannerText: "",
        infoBannerColor: "",
        endpointCompatibility: "openai" as const
      };

      const createdModel = await createAiProviderModel(modelData);
      
      const updateData = {
        active: false,
      };

      const updatedModel = await updateAiProviderModel(
        TEST_ORGANISATION_1.id,
        createdModel.id,
        updateData
      );

      expect(updatedModel).toBeDefined();
      expect(updatedModel.id).toBe(createdModel.id);
      expect(updatedModel.active).toBe(false);
    });

    test("should handle updating non-existent model", async () => {
      try {
        await updateAiProviderModel(
          TEST_ORGANISATION_1.id,
          "non-existent-id",
          { active: false }
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe("deleteAiProviderModel", () => {
    test("should delete an existing AI provider model", async () => {
      // First create a model to delete
      const modelData = {
        organisationId: TEST_ORGANISATION_1.id,
        name: "test-model-5",
        model: "gpt-3.5-turbo",
        provider: "openai",
        description: "Test model 5",
        inputType: ["text" as const],
        outputType: ["text" as const],
        label: "Test Model 5",
        maxTokens: 4096,
        maxOutputTokens: 2048,
        endpoint: "https://api.openai.com/v1",
        hostingOrigin: "openai",
        usesInternet: true,
        active: true,
        system: false,
        showInfoBanner: false,
        infoBannerText: "",
        infoBannerColor: "",
        endpointCompatibility: "openai" as const
      };

      const createdModel = await createAiProviderModel(modelData);
      
      const deletedModel = await deleteAiProviderModel(
        TEST_ORGANISATION_1.id,
        createdModel.id
      );

      expect(deletedModel).toBeDefined();
      expect(deletedModel.id).toBe(createdModel.id);

      // Verify model is deleted
      try {
        await getAiProviderModelById(TEST_ORGANISATION_1.id, createdModel.id);
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    test("should handle deleting non-existent model", async () => {
      try {
        await deleteAiProviderModel(
          TEST_ORGANISATION_1.id,
          "non-existent-id"
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});
