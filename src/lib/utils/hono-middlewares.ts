import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import jwtlib from "jsonwebtoken";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import { hasPermission } from "../auth/permissions";

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || "";

// Hono can´t handle Auth0 JWT tokens
// https://github.com/honojs/hono/issues/672

/**
 * Helper function to get the JWT token from the request
 */
const getTokenFromJwt = (token: string) => {
  return jwtlib.verify(token, JWT_PUBLIC_KEY, {
    algorithms:
      _GLOBAL_SERVER_CONFIG.authType === "auth0" ? ["RS256"] : undefined,
  });
};

/**
 * HONO Middleware to add the user to the context
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
 * HONO Middleware to check if the user has permission for the given path and method
 */
export async function checkUserPermission(c: Context, next: Function) {
  // HACK!!!
  await next();
  // const userId = c.get("usersId");
  // const method = c.req.method;
  // const path = c.req.path;
  // const userCanAccess = await hasPermission(userId, method, path);
  // if (!userCanAccess) {
  //   return c.text("Not permitted", 403);
  // }
  // await next();
}

/**
 * HONO Middleware to check the JWT token
 */
export const checkToken = (c: Context) => {
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
 * HONO Middleware to set the usersEmail, usersId and usersRoles in the context
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
 * HONO Middleware to check the JWT token and redirect to login if not valid
 */
export const authOrRedirectToLogin = async (c: Context, next: Function) => {
  try {
    checkToken(c);
  } catch (error) {
    return c.redirect("/#/login");
  }
  await next();
};

/**
 * HONO Middleware to check the JWT token and redirect to login if not valid
 * and set the usersEmail, usersId and usersRoles in the context
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
      return c.redirect("/#/login");
    }
  } catch (err) {
    return c.redirect("/#/login");
  }
  await next();
};
