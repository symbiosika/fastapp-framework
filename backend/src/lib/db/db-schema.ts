/**
 * Main Schema for the database
 */
import * as userTables from "./schema/users";
import * as secrets from "./schema/secrets";
import * as files from "./schema/files";
import * as embeddings from "./schema/embeddings";
import * as payment from "./schema/payment";

// export all tables for drizzle-kit
export * from "./schema/users";
export * from "./schema/secrets";
export * from "./schema/files";
export * from "./schema/embeddings";
export * from "./schema/payment";

// import custom drizzle schema
let customDrizzleSchema = {};
try {
  const importedSchema = require("./../../../custom-drizzle-schema");
  customDrizzleSchema = importedSchema.default || importedSchema;
  console.log("Custom drizzle schema found. Using custom schema.");
  console.log("Added custom drizzle schema", Object.keys(customDrizzleSchema));
} catch (error) {
  console.log("No custom drizzle schema found. Using only default schema.");
}

export const dbSchema = {
  ...customDrizzleSchema,
  // auth tables
  users: userTables.users,
  userGroups: userTables.userGroups,
  userGroupMembers: userTables.userGroupMembers,
  userGroup: userTables.userGroups,
  usersRelations: userTables.usersRelations,
  userGroupsRelations: userTables.userGroupsRelations,
  userGroupMembersRelations: userTables.userGroupMembersRelations,
  sessionsRelations: userTables.sessionsRelations,
  // app wide secrets
  secrets: secrets.secrets,
  sessions: userTables.sessions,
  // files
  files: files.files,
  // embeddings
  embeddings: embeddings.embeddings,
  // payment
  activeSubscriptions: payment.activeSubscriptions,
  purchases: payment.purchases,
};
console.log("Collection tables", Object.keys(dbSchema));

/**
 * Export the database schema and the valid table names.
 */
export type DatabaseSchema = typeof dbSchema;
export const validTableNames = Object.keys(dbSchema);
