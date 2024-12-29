import { describe, it, expect, beforeAll } from "bun:test";
import {
  createDatabaseClient,
  getDb,
  waitForDbConnection,
} from "../db/db-connection";
import {
  decryptParameters,
  encryptParameters,
  validatePluginConfiguration,
} from ".";
import { secrets } from "../db/db-schema";
import type {
  PluginConfigurationWithoutSecrets,
  PluginParameterDescription,
} from "../types/plugins";
import { eq } from "drizzle-orm";
import { initTestOrganisation } from "../../test/init.test";

// Setup database connection
beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();
  await initTestOrganisation();
});

const delTestItems = async () => {
  await getDb()
    .delete(secrets)
    .where(eq(secrets.reference, "plugin:test-plugin"));
};

const basePluginConfig: PluginConfigurationWithoutSecrets = {
  id: "471fceff-382c-4650-9266-d6f2ac1e67a3",
  name: "test-plugin",
  description: "Test plugin",
  pluginType: "test",
  version: 1,
  meta: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  organisationId: "00000000-1111-1111-1111-000000000000",
};

const demoPluginConfig: PluginConfigurationWithoutSecrets = {
  ...basePluginConfig,
  meta: {
    url: { type: "string", value: "https://api.example.com" },
    enabled: { type: "boolean", value: true },
    retries: { type: "number", value: 3 },
    apiKey: { type: "secret", id: "secret-123" },
  },
};

const damagedDemoPluginConfig: PluginConfigurationWithoutSecrets = {
  ...basePluginConfig,
  meta: {
    apiKey: { type: "string", value: "secret-123" },
  },
};

const demoPluginConfigToEncrypt: PluginConfigurationWithoutSecrets = {
  ...basePluginConfig,
  meta: {
    normalParam: { type: "string", value: "normal value" },
    secretParam: {
      type: "secret",
      inputValue: "test secret",
    },
  },
};

describe("Plugin Parameter Validation", () => {
  it("validates correct plugin configuration", () => {
    const serverPluginParameters: PluginParameterDescription[] = [
      {
        name: "url",
        type: "string" as const,
        category: "general",
        label: "URL",
        description: "API endpoint URL",
      },
      {
        name: "enabled",
        type: "boolean" as const,
        category: "general",
        label: "Enabled",
        description: "Enable/disable the plugin",
      },
      {
        name: "retries",
        type: "number" as const,
        category: "general",
        label: "Retries",
        description: "Number of retry attempts",
      },
      {
        name: "apiKey",
        type: "secret" as const,
        category: "security",
        label: "API Key",
        description: "API key for authentication",
      },
    ];

    const result = validatePluginConfiguration(
      serverPluginParameters,
      demoPluginConfig
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing parameters", () => {
    const serverPluginParameters: PluginParameterDescription[] = [
      {
        name: "url",
        type: "string" as const,
        category: "general",
        label: "URL",
        description: "API endpoint URL",
      },
      {
        name: "apiKey",
        type: "secret" as const,
        category: "security",
        label: "API Key",
        description: "API key for authentication",
      },
    ];

    const result = validatePluginConfiguration(
      serverPluginParameters,
      damagedDemoPluginConfig
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0]).toEqual("Missing required parameter: url");
    expect(result.errors[1]).toEqual(
      "Invalid type for parameter apiKey: expected secret, got string"
    );
  });
});

describe("Parameter Encryption and Decryption", () => {
  it("encrypts parameters with new secrets", async () => {
    await delTestItems();
    const encrypted = await encryptParameters(demoPluginConfigToEncrypt);

    expect(encrypted.normalParam).toEqual({
      type: "string",
      value: "normal value",
    });
    expect(encrypted.secretParam.type).toBe("secret");
    // @ts-ignore
    expect(encrypted.secretParam.id).toBeDefined();

    // Verify secret was stored in database
    const dbSecret = await getDb()
      .select()
      .from(secrets)
      // @ts-ignore
      .where(eq(secrets.id, encrypted.secretParam.id));

    expect(dbSecret).toHaveLength(1);
    expect(dbSecret[0].reference).toBe("plugin:test-plugin");
  });

  it("decrypts parameters correctly", async () => {
    await delTestItems();
    const encrypted = await encryptParameters(demoPluginConfigToEncrypt);
    const decrypted = await decryptParameters({
      ...basePluginConfig,
      meta: encrypted,
    });

    expect(decrypted.normalParam).toEqual({
      type: "string",
      value: "normal value",
    });
    expect(decrypted.secretParam.type).toBe("secret");
    // @ts-ignore
    expect(decrypted.secretParam.decryptedValue).toBe("test secret");
  });
});
