/*
Get and set configurations for server plugins
*/

import { eq } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import {
  plugins,
  secrets,
  type PluginsInsert,
  type PluginsUpdate,
} from "../db/db-schema";
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
  PluginConfigurationWithoutSecretsAndState,
} from "../types/plugins";
import log from "../log";
import * as v from "valibot";

// In memory cache of available plugins
const availablePlugins: { [type: string]: ServerPlugin } = {};
const installedPlugins: {
  [name: string]: PluginConfigurationWithSecrets;
} = {};

/**
 * Access the in-memory cache of installed plugins safely
 */
export const getActivePluginByName = (
  name: string
): PluginConfigurationWithSecrets => {
  if (!installedPlugins[name]) {
    throw new Error(`Plugin ${name} is not installed`);
  }
  return installedPlugins[name];
};

/**
 * Update/Insert a plugin configuration to the in-memory cache
 */
export const updateInstalledPlugin = async (pluginName: string) => {
  const plugin = await getPluginConfigWithSecrets({ name: pluginName });
  installedPlugins[pluginName] = plugin;
};

/**
 * Remove a plugin from the in-memory cache
 */
export const removeInstalledPlugin = (pluginName: string) => {
  delete installedPlugins[pluginName];
};

/**
 * Access the in-memory cache of available plugins safely
 */
export const getAvailablePluginByType = (type: string): ServerPlugin => {
  if (!availablePlugins[type]) {
    throw new Error(`Plugin ${type} is not available`);
  }
  return availablePlugins[type];
};

/**
 * Add a plugin to the available plugins. Needs to be done on every startup
 */
export const registerServerPlugin = (plugin: ServerPlugin) => {
  availablePlugins[plugin.name] = plugin;
};

const pluginConfigSchemaInDb = v.object({
  pluginId: v.string(),
  name: v.string(),
  version: v.number(),
  meta: v.record(
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
  description: v.string(),
  pluginType: v.string(),
  version: v.number(),
  meta: v.record(
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
            // referenceId: plugin.id,
          })
          .where(eq(secrets.id, id));

        encryptedParams[key] = { type: "secret", id };
      } else {
        // Create new secret
        const [newSecret] = await getDb()
          .insert(secrets)
          .values({
            reference: `plugin:${plugin.name}`,
            // referenceId: plugin.id,
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
  config: Record<string, any>,
  encrypted: boolean = true
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
        if (!("id" in value) && encrypted) {
          errors.push(`Secret parameter ${param.name} must have an id`);
        } else if (!encrypted && !("inputValue" in value)) {
          errors.push(`Secret parameter ${param.name} must have an inputValue`);
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
export const getPlugin = async (query: {
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

  // check if the plugin type is registered
  if (!availablePlugins[pluginDbResult[0].pluginType]) {
    throw new Error("Plugin type is not registered");
  }
  const serverPlugin = availablePlugins[pluginDbResult[0].pluginType];

  try {
    // check basic structure
    // await v.parseAsync(pluginConfigSchemaInDb, pluginDbResult[0]);
  } catch (error) {
    log.error("Error parsing body for plugin configuration", error + "");
    throw error;
  }

  try {
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

    // Add version update check
    const updatedConfig = await updatePluginVersion(
      serverPlugin,
      pluginDbResult[0] as PluginConfigurationWithSecrets
    );

    return updatedConfig;
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
}): Promise<PluginConfigurationWithSecrets> => {
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
  pluginConfig: PluginsUpdate
): Promise<PluginConfigurationWithoutSecrets> => {
  // check input
  await v.safeParseAsync(pluginConfigSchemaFromUser, pluginConfig);
  const encryptedParams = await encryptParameters(pluginConfig as any);

  const plugin = await getPlugin({ id: pluginConfig.id });

  // merge the existing config.meta. overwrite all main keys with the new values
  const mergedMeta = {
    ...plugin.meta,
    ...encryptedParams,
  };

  // check if the new config is valid
  const serverPlugin = availablePlugins[plugin.pluginType] ?? null;
  if (!serverPlugin) {
    throw new Error("Plugin type is not registered");
  }
  const checked = validatePluginConfiguration(
    serverPlugin.neededParameters,
    pluginConfig
  );
  if (!checked.isValid) {
    throw new Error(
      "Invalid plugin configuration: " + checked.errors.join("\n")
    );
  }

  const updated = await getDb()
    .update(plugins)
    .set({
      updatedAt: new Date().toISOString(),
      meta: mergedMeta,
      description: pluginConfig.description,
    })
    .where(eq(plugins.id, plugin.id))
    .returning();

  // Update in-memory cache
  await updateInstalledPlugin(updated[0].name);

  return updated[0] as PluginConfigurationWithoutSecrets;
};

/**
 * Get all available plugins to return it to the user
 */
export const getAllAvailablePlugins = async (): Promise<ServerPlugin[]> => {
  return Object.values(availablePlugins).map((plugin) => ({
    name: plugin.name,
    version: plugin.version,
    neededParameters: plugin.neededParameters,
  }));
};

/**
 * Get all installed plugins with their validated configuration but encrypted secrets
 */
export const getAllInstalledPlugins = async (): Promise<
  PluginConfigurationWithoutSecretsAndState[]
> => {
  const installed = await getDb().select().from(plugins);
  const result: PluginConfigurationWithoutSecretsAndState[] = [];

  for (const plugin of installed) {
    // get the plugin in validated state
    try {
      const p = await getPlugin({ id: plugin.id });
      result.push({
        ...p,
        isValid: true,
        error: null,
      });
    } catch (error) {
      result.push({
        ...plugin,
        meta: {},
        isValid: false,
        error: error + "",
      });
    }
  }
  return result;
};

/**
 * Create a new plugin configuration
 */
export const createPlugin = async (
  pluginConfig: PluginsInsert
): Promise<PluginConfigurationWithoutSecrets> => {
  // Validate input structure
  await v.safeParseAsync(pluginConfigSchemaFromUser, pluginConfig);

  // Check if plugin type is registered
  const serverPlugin = availablePlugins[pluginConfig.pluginType];
  if (!serverPlugin) {
    throw new Error(
      `Plugin type '${pluginConfig.pluginType}' is not registered`
    );
  }

  // check if the plugin name is already installed
  const existing = await getDb()
    .select()
    .from(plugins)
    .where(eq(plugins.name, pluginConfig.name));
  if (existing.length > 0) {
    throw new Error(`Plugin '${pluginConfig.name}' is already installed`);
  }

  // Validate configuration
  const checked = validatePluginConfiguration(
    serverPlugin.neededParameters,
    pluginConfig,
    false
  );
  if (!checked.isValid) {
    throw new Error(
      "Invalid plugin configuration: " + checked.errors.join("\n")
    );
  }

  // Encrypt parameters
  const encryptedParams = await encryptParameters(pluginConfig as any);

  // Insert new plugin
  const [newPlugin] = await getDb()
    .insert(plugins)
    .values({
      name: pluginConfig.name,
      description: pluginConfig.description,
      pluginType: pluginConfig.pluginType,
      version: serverPlugin.version,
      meta: encryptedParams,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  // Update in-memory cache with the new plugin
  await updateInstalledPlugin(newPlugin.name);

  return newPlugin as PluginConfigurationWithoutSecrets;
};

/**
 * Delete a plugin configuration and its associated secrets
 */
export const deletePlugin = async (query: {
  id?: string;
  name?: string;
}): Promise<void> => {
  let where;
  if (query.id) {
    where = eq(plugins.id, query.id);
  } else if (query.name) {
    where = eq(plugins.name, query.name);
  } else {
    throw new Error("Either id or name must be provided");
  }
  const plugin = (await getDb()
    .select()
    .from(plugins)
    .where(where)) as PluginConfigurationWithoutSecrets[];
  if (plugin.length === 0) {
    throw new Error("Plugin not found");
  }
  // Delete associated secrets first
  for (const [_, param] of Object.entries(plugin[0].meta ?? {})) {
    if (param.type === "secret" && param.id) {
      await getDb().delete(secrets).where(eq(secrets.id, param.id));
    }
  }
  // Remove from in-memory cache
  removeInstalledPlugin(plugin[0].name);

  // Delete the plugin configuration
  await getDb().delete(plugins).where(eq(plugins.id, plugin[0].id));
};

// Refresh the in-memory cache
export const initializePluginCache = async () => {
  const plugins = await getAllInstalledPlugins();
  for (const plugin of plugins) {
    if (plugin.isValid) {
      await updateInstalledPlugin(plugin.name);
    }
  }
};
