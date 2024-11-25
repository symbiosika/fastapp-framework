import type { PluginsSelect } from "../db/db-schema";

export type PluginParameterString = {
  type: "string";
  value: string;
};

export type PluginParameterBoolean = {
  type: "boolean";
  value: boolean;
};

export type PluginParameterNumber = {
  type: "number";
  value: number;
};

// used to insert or update a secret
export type InsertPluginParameterSecret = {
  type: "secret";
  id?: string;
  inputValue?: string;
};

// used to select a secret with hidden value
export type PluginParameterSecret = {
  type: "secret";
  id: string;
};

// used to select a secret with decrypted value. can only be used in the server
export type PluginParameterSecretDecrypted = {
  type: "secret";
  id: string;
  decryptedValue: string;
};

export interface EncryptedParameters {
  [param: string]:
    | PluginParameterString
    | PluginParameterBoolean
    | PluginParameterNumber
    | PluginParameterSecret
    | InsertPluginParameterSecret;
}

export interface DecryptedParameters {
  [param: string]:
    | PluginParameterString
    | PluginParameterBoolean
    | PluginParameterNumber
    | PluginParameterSecretDecrypted;
}

export type PluginConfigurationWithSecrets = PluginsSelect & {
  meta: DecryptedParameters;
};

export type PluginConfigurationWithoutSecrets = PluginsSelect & {
  meta: EncryptedParameters;
};

export type PluginConfigurationWithoutSecretsAndState =
  PluginConfigurationWithoutSecrets & {
    isValid: boolean;
    error: string | null;
  };

export interface PluginParameterDescription {
  category: string; // e.g. "general", "security", "advanced"
  type: "string" | "boolean" | "number" | "secret";
  name: string;
  label: string;
  description: string;
}

export interface ServerPlugin {
  /**
   * The unique name of the plugin
   */
  name: string;
  /**
   * The server-side version of the plugin
   */
  version: number;
  /**
   * The parameters that areneeded to configure the plugin
   */
  neededParameters: PluginParameterDescription[];
  /**
   * The api endpoints provided by the plugin. Optional
   */
  apiEndpoints?: {
    [endpointName: string]: {
      method: "GET" | "POST" | "PUT" | "DELETE";
      action: (
        config: PluginConfigurationWithSecrets,
        params: { [key: string]: string },
        body: any
      ) => Promise<any>;
    };
  };
  /**
   * The function to upgrade the configuration from the previous version.
   * This will update the meta field in the db if executed. Optional
   */
  versionUpgrader?: (
    actualConfigVersionInDb: number,
    pluginConfig: PluginConfigurationWithSecrets
  ) => Promise<PluginConfigurationWithSecrets>;
}
