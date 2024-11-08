import {
  secrets,
  type SecretsInsert,
  type SecretsSelect,
} from "../db/schema/secrets";
import { eq, and } from "drizzle-orm";
import { encryptAes, decryptAes } from "./aes";
import { getDb } from "../db/db-connection";

/**
 * Check is a name is fully uppercase and only contains letters, numbers and underscores
 */
export function isValidSecretName(name: string) {
  return /^[A-Z0-9_]+$/.test(name);
}

/**
 * Set a new secret to use it in the backend
 */
export async function setSecret(data: {
  name: string;
  value: string;
}): Promise<SecretsSelect> {
  if (!isValidSecretName(data.name)) {
    throw new Error(
      "Invalid secret name Only. uppercase letters, numbers and underscores are allowed"
    );
  }
  // Encrypt the value before storing
  const encrypted = encryptAes(data.value);

  // Insert new secret
  const entries = await getDb()
    .insert(secrets)
    .values({
      reference: "VARIABLES",
      name: data.name,
      label: data.name,
      value: encrypted.value,
      type: encrypted.algorithm,
    })
    .onConflictDoUpdate({
      target: [secrets.reference, secrets.name],
      set: {
        value: encrypted.value,
        type: encrypted.algorithm,
      },
    })
    .returning();

  return { ...entries[0], value: "" };
}

/**
 * Get a backend secret by its name
 */
export async function getSecret(name: string): Promise<string | null> {
  const result = await getDb()
    .select()
    .from(secrets)
    .where(and(eq(secrets.reference, "VARIABLES"), eq(secrets.name, name)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }
  const secret = result[0];
  // Decrypt the value before returning
  const decrypted = decryptAes(secret.value);

  return decrypted.value;
}

/**
 * Delete a backend secret by its name
 */
export async function deleteSecret(name: string) {
  return await getDb()
    .delete(secrets)
    .where(and(eq(secrets.reference, "VARIABLES"), eq(secrets.name, name)))
    .returning();
}

/**
 * Get all backend secrets
 */
export async function getSecrets() {
  return await getDb()
    .select({
      id: secrets.id,
      name: secrets.name,
    })
    .from(secrets)
    .where(eq(secrets.reference, "VARIABLES"));
}
