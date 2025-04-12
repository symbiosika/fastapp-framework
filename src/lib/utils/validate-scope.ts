import type { Context } from "hono";

/**
 * Creates a HONO Middleware to validate if the user has the required scope
 * @param requiredScope The required scope to check for. Defaults to "all"
 */
export const validateScope = (requiredScope: string = "all") => {
  return async (c: Context, next: Function) => {
    const scopes = c.get("scopes") as string[];

    if (scopes.includes("all")) {
      await next();
      return;
    }

    if (!scopes.includes(requiredScope)) {
      return c.text(`Missing required scope: ${requiredScope}`, 403);
    }

    await next();
  };
};
