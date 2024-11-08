import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import jwtlib from "jsonwebtoken";
import { _GLOBAL_SERVER_CONFIG } from "./index";
import { hasPermission } from "./lib/auth/permissions";

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || "";

// Hono can´t handle Auth0 JWT tokens
// https://github.com/honojs/hono/issues/672

/**
 * Validate all environment variables
 */
export const validateAllEnvVariables = (
  customEnvVariablesToCheckOnStartup: string[] = []
) => {
  const requiredEnvVars = [
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "OPENAI_API_KEY",
    "LLAMA_CLOUD_API_KEY",
    "AUTH_SECRET",
    "SECRETS_AES_KEY",
    "SECRETS_AES_IV",
    "JWT_PUBLIC_KEY",
  ];
  const missingEnvVars = requiredEnvVars
    .concat(customEnvVariablesToCheckOnStartup)
    .filter((envVar) => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.error("Missing environment variables:", missingEnvVars);
    process.exit(1);
  } else {
    console.log("All environment variables are set");
  }
};

/**
 * JWT validation
 */
const getTokenFromJwt = (token: string) => {
  return jwtlib.verify(token, JWT_PUBLIC_KEY, {
    algorithms:
      _GLOBAL_SERVER_CONFIG.authType === "auth0" ? ["RS256"] : undefined,
  });
};

/**
 * Add the user to context
 */
export function addUserToContext(
  c: Context<any, any, {}>,
  decodedAndVerifiedToken: jwtlib.JwtPayload
) {
  c.set("usersEmail", decodedAndVerifiedToken.email ?? "");
  c.set("usersId", decodedAndVerifiedToken.sub ?? "");
  // c.set("usersRoles", decodedAndVerifiedToken["symbiosika/roles"] ?? []);
}

/**
 * Check if the user has permission for the given path and method
 */
export async function checkUserPermission(c: Context, next: Function) {
  const userId = c.get("usersId");
  const method = c.req.method;
  const path = c.req.path;
  const userCanAccess = await hasPermission(userId, method, path);
  if (!userCanAccess) {
    return c.text("Not permitted", 403);
  }
  await next();
}

/**
 * Token validation
 */
const checkToken = (c: Context) => {
  let token = "";

  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = getCookie(c, "jwt") || "";
  }
  if (!token) {
    throw new Error("Invalid token");
  }
  const decoded = getTokenFromJwt(token);

  return decoded;
};

/**
 * Middleware for JWT authentication
 * Will set the usersEmail, usersId and usersRoles in the context
 */
export const authAndSetUsersInfo = async (c: Context, next: Function) => {
  try {
    const decodedAndVerifiedToken = checkToken(c);
    if (typeof decodedAndVerifiedToken === "object") {
      addUserToContext(c, decodedAndVerifiedToken);
    } else {
      return c.text("Invalid token", 401);
    }
  } catch (err) {
    return c.text("Unauthorized", 401);
  }
  await next();
};

/**
 * Middletware for JWT authentication
 * Will only check the JWT cookie and red
 */
export const authOrRedirectToLogin = async (c: Context, next: Function) => {
  try {
    checkToken(c);
  } catch (error) {
    return c.redirect("/login.html");
  }
  await next();
};

/**
 * Middleware for JWT authentication
 * Will check the JWT cookie and redirect to login if not valid
 */
export const authAndSetUsersInfoOrRedirectToLogin = async (
  c: Context,
  next: Function
) => {
  try {
    const decodedAndVerifiedToken = checkToken(c);

    if (typeof decodedAndVerifiedToken === "object") {
      addUserToContext(c, decodedAndVerifiedToken);
    } else {
      return c.redirect("/login.html");
    }
  } catch (err) {
    return c.redirect("/login.html");
  }
  await next();
};
