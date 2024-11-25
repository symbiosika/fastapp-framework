/*
Get and set configurations for server plugins
*/

// In memory cache of available plugins
const availablePlugins: { [key: string]: ServerPlugin } = {};

import { eq } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import { plugins, secrets } from "../db/db-schema";
import { decryptAes, encryptAes } from "../crypt/aes";
import type {
  DecryptedParameters,
  EncryptedParameters,
  PluginConfigurationWithoutSecrets,
  PluginConfigurationWithSecrets,
  PluginParameterDescription,
  ServerPlugin,
  PluginParameterString,
  PluginParameterBoolean,
  PluginParameterNumber,
  PluginParameterSecret,
} from "../types/plugins";
import log from "../log";
import * as v from "valibot";

const pluginConfigSchemaInDb = v.object({
  pluginId: v.string(),
  name: v.string(),
  version: v.number(),
  parameters: v.record(
    v.string(),
    v.union([
      v.object({
        type: v.literal("string"),
        value: v.string(),
      }),
      v.object({
        type: v.literal("boolean"),
        value: v.boolean(),
      }),
      v.object({
        type: v.literal("number"),
        value: v.number(),
      }),
      v.object({
        type: v.literal("secret"),
        id: v.string(),
      }),
    ])
  ),
});

const pluginConfigSchemaFromUser = v.object({
  pluginId: v.string(),
  name: v.string(),
  version: v.number(),
  parameters: v.record(
    v.string(),
    v.union([
      v.object({
        type: v.literal("string"),
        value: v.string(),
      }),
      v.object({
        type: v.literal("boolean"),
        value: v.boolean(),
      }),
      v.object({
        type: v.literal("number"),
        value: v.number(),
      }),
      v.object({
        type: v.literal("secret"),
        id: v.optional(v.string()),
        inputValue: v.optional(v.string()),
      }),
    ])
  ),
});

/**
 * Add a plugin to the available plugins. Needs to be done on every startup
 */
export const registerServerPlugin = (plugin: ServerPlugin) => {
  availablePlugins[plugin.name] = plugin;
};

/**
 * Decrypt a plugin configuration
 */
export const decryptParameters = async (
  plugin: PluginConfigurationWithoutSecrets
): Promise<DecryptedParameters> => {
  const decryptedParams: DecryptedParameters = {};

  for (const key in plugin.meta) {
    const param = plugin.meta[key];

    // Handle non-secret parameters by direct assignment
    if (param.type !== "secret") {
      decryptedParams[key] = param as
        | PluginParameterString
        | PluginParameterBoolean
        | PluginParameterNumber;
      continue;
    }

    // Handle secret parameters
    const secretParam = param as PluginParameterSecret;
    if (!secretParam.id || secretParam.id === "") {
      log.error("secret id is empty for plugin", plugin.name, key);
      continue;
    }

    const secretDbResult = await getDb()
      .select()
      .from(secrets)
      .where(eq(secrets.id, secretParam.id));

    if (!secretDbResult || secretDbResult.length === 0) {
      log.error(
        `Secret with id ${secretParam.id} (${key}) not found for plugin ${plugin.name}`
      );
      continue;
    }

    const secret = decryptAes(secretDbResult[0].value);
    decryptedParams[key] = {
      type: "secret",
      id: secretDbResult[0].id,
      decryptedValue: secret.value,
    };
  }

  return decryptedParams;
};

/**
 * Encrypt a plugin configuration
 */
export const encryptParameters = async (
  plugin: PluginConfigurationWithoutSecrets
): Promise<EncryptedParameters> => {
  const encryptedParams: EncryptedParameters = {};

  for (const key in plugin.meta) {
    const param = plugin.meta[key];

    // Handle non-secret parameters
    if (param.type !== "secret") {
      encryptedParams[key] = param;
      continue;
    }

    // Handle secret parameters
    if ("inputValue" in param) {
      // Case: Parameter has optional inputValue field
      const { id, inputValue } = param;

      if (!inputValue) {
        // Skip if no new value provided but id exists
        if (id) {
          encryptedParams[key] = { type: "secret", id };
          continue;
        }
        throw new Error(
          `Secret parameter ${key} requires either an id or inputValue`
        );
      }

      // Encrypt the new value
      const val = encryptAes(inputValue);

      if (id) {
        // Update existing secret
        await getDb()
          .update(secrets)
          .set({
            value: val.value,
            type: val.algorithm,
            reference: `plugin:${plugin.name}`,
            referenceId: plugin.id,
          })
          .where(eq(secrets.id, id));

        encryptedParams[key] = { type: "secret", id };
      } else {
        // Create new secret
        const [newSecret] = await getDb()
          .insert(secrets)
          .values({
            reference: `plugin:${plugin.name}`,
            referenceId: plugin.id,
            name: key,
            value: val.value,
            type: val.algorithm,
            label: key,
          })
          .returning();

        encryptedParams[key] = { type: "secret", id: newSecret.id };
      }
    } else {
      // Case: Parameter only has id field
      encryptedParams[key] = { type: "secret", id: param.id };
    }
  }
  return encryptedParams;
};

/**
 * Validate a plugin configuration
 */
export function validatePluginConfiguration(
  serverPluginParameters: PluginParameterDescription[],
  config: PluginConfigurationWithoutSecrets
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const param of serverPluginParameters) {
    const value = config.meta[param.name];

    // Check if parameter exists
    if (!value) {
      errors.push(`Missing required parameter: ${param.name}`);
      continue;
    }

    // Check if parameter has correct type
    if (value.type !== param.type) {
      errors.push(
        `Invalid type for parameter ${param.name}: expected ${param.type}, got ${value.type}`
      );
      continue;
    }

    // Type-specific validation
    switch (param.type) {
      case "string":
        if (value.type === "string" && typeof value.value !== "string") {
          errors.push(`Parameter ${param.name} must be a string`);
        }
        break;
      case "boolean":
        if (value.type === "boolean" && typeof value.value !== "boolean") {
          errors.push(`Parameter ${param.name} must be a boolean`);
        }
        break;
      case "number":
        if (value.type === "number" && typeof value.value !== "number") {
          errors.push(`Parameter ${param.name} must be a number`);
        }
        break;
      case "secret":
        if (!("id" in value)) {
          errors.push(`Secret parameter ${param.name} must have an id`);
        }
        break;
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to get a plugin from the database
 * Will also check if the meta configuration is valid
 */
const getPlugin = async (query: {
  id?: string;
  name?: string;
}): Promise<PluginConfigurationWithoutSecrets> => {
  if (!query.id && !query.name) {
    throw new Error("Either id or name must be provided");
  }
  let pluginDbResult;
  if (query.id) {
    pluginDbResult = await getDb()
      .select()
      .from(plugins)
      .where(eq(plugins.id, query.id));
  } else if (query.name) {
    pluginDbResult = await getDb()
      .select()
      .from(plugins)
      .where(eq(plugins.name, query.name));
  }
  if (!pluginDbResult || pluginDbResult.length < 1) {
    throw new Error("Plugin not found");
  }

  // check if the plugin is registered
  if (!availablePlugins[pluginDbResult[0].name]) {
    throw new Error("Plugin type is not registered");
  }
  const serverPlugin = availablePlugins[pluginDbResult[0].name];

  try {
    // check basic structure
    await v.parseAsync(pluginConfigSchemaInDb, pluginDbResult[0].meta);
    // check structure and types
    const checked = validatePluginConfiguration(
      serverPlugin.neededParameters,
      pluginDbResult[0] as PluginConfigurationWithoutSecrets
    );
    if (!checked.isValid) {
      const err = "Invalid plugin configuration: " + checked.errors.join("\n");
      log.error(err);
      throw new Error(err);
    }

    return pluginDbResult[0] as PluginConfigurationWithoutSecrets;
  } catch (error) {
    log.error("Error parsing plugin configuration", error + "");
    throw error;
  }
};

/**
 * Check if a plugin needs to update its configuration
 */
const updatePluginVersion = async (
  plugin: ServerPlugin,
  pluginConfig: PluginConfigurationWithSecrets
): Promise<PluginConfigurationWithSecrets> => {
  try {
    if (plugin.version < pluginConfig.version && plugin.versionUpgrader) {
      const newConfig = await plugin.versionUpgrader(
        pluginConfig.version,
        pluginConfig
      );
      await getDb()
        .update(plugins)
        .set({ meta: newConfig.meta })
        .where(eq(plugins.id, pluginConfig.id));
      return newConfig;
    }
  } catch (error) {
    log.error("Error upgrading plugin configuration", error + "");
    throw "Error upgrading plugin configuration. " + error;
  }
  return pluginConfig;
};

/**
 * A function to get the whole configuration for a server plugin
 * will resolve all secrets if needed
 */
export const getPluginConfigWithSecrets = async (query: {
  id?: string;
  name?: string;
}): Promise<PluginConfigurationWithoutSecrets> => {
  const plugin = await getPlugin(query);
  const decrypted = await decryptParameters(plugin);
  return {
    ...plugin,
    meta: decrypted,
  };
};

/**
 * Update an existing plugin configuration
 */
export const setPluginConfig = async (
  pluginConfig: PluginConfigurationWithoutSecrets
): Promise<PluginConfigurationWithoutSecrets> => {
  // check input
  await v.safeParseAsync(pluginConfigSchemaFromUser, pluginConfig);
  const encryptedParams = await encryptParameters(pluginConfig);

  const plugin = await getPlugin({ id: pluginConfig.id });

  // merge the existing config.meta. overwrite all main keys with the new values
  const mergedMeta = {
    ...plugin.meta,
    ...encryptedParams,
  };

  const updated = await getDb()
    .update(plugins)
    .set({
      updatedAt: new Date().toISOString(),
      meta: mergedMeta,
      description: pluginConfig.description,
    })
    .where(eq(plugins.id, pluginConfig.id))
    .returning();

  return updated[0] as PluginConfigurationWithoutSecrets;
};
