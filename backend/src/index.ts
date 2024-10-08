import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { validateAllEnvVariables } from "./helper";
import { HTTPException } from "hono/http-exception";
import jwtlib from "jsonwebtoken";
import { getDb } from "./lib/db/db-connection";
import { users } from "./lib/db/db-schema";
import { eq } from "drizzle-orm";
import { LocalAuth } from "./lib/auth";
import fs from "fs/promises";
import { getCookie } from "hono/cookie";
import { serveStatic } from "hono/bun";
import FileHander from "./routes/files";
import path from "path";
import { getCollection, postCollection } from "./routes/collections/[name]";
import {
  deleteCollectionById,
  getCollectionById,
  putCollectionById,
} from "./routes/collections/[name]/[id]";
import paymentRoutes from "./routes/payment";

/**
 * validate .ENV variables
 */
validateAllEnvVariables();

type HonoContextVariables = {
  usersId: string;
  usersEmail: string;
  usersRoles: string[];
};

const app = new Hono<{ Variables: HonoContextVariables }>();
app.use(logger());

/**
 * Server configuration
 */
const PORTSTR = process.env.PORT!;
const PORT = parseInt(PORTSTR);
const AUTH_TYPE: "local" | "auth0" = (process.env.AUTH_TYPE as any) || "local";

/**
 * CORS configuration
 */
const originsFromEnv = process.env.ALLOWED_ORIGINS;
const ALLOWED_ORIGINS = originsFromEnv ? originsFromEnv.split(",") : [];
const jwtPublicKey = process.env.JWT_PUBLIC_KEY || "";
console.log("Allowed origins:", ALLOWED_ORIGINS);

/**
 * JWT validation
 */
const getTokenFromJwt = (token: string) => {
  return jwtlib.verify(token, jwtPublicKey, {
    algorithms: AUTH_TYPE === "auth0" ? ["RS256"] : undefined,
  });
};

/**
 * Add the user to context
 */
function addUserToContext(
  c: Context<any, any, {}>,
  decodedAndVerifiedToken: jwtlib.JwtPayload
) {
  c.set("usersEmail", decodedAndVerifiedToken.email ?? "");
  c.set("usersId", decodedAndVerifiedToken.sub ?? "");
  // c.set("usersRoles", decodedAndVerifiedToken["symbiosika/roles"] ?? []);
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
const authAndSetUsersInfo = async (c: Context, next: Function) => {
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
const authOrRedirectToLogin = async (c: Context, next: Function) => {
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
const authAndSetUsersInfoOrRedirectToLogin = async (
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

/**
 * Middleware for CORS
 */
app.use(
  "/*",
  cors({
    origin: ALLOWED_ORIGINS,
  })
);

// Hono can´t handle Auth0 JWT tokens
// https://github.com/honojs/hono/issues/672

/**
 * A Ping endpoint
 */
app.get("/api/v1/ping", async (c) => {
  return c.json({
    online: true,
  });
});

/**
 * Get the own user
 */
app.get("/api/v1/user/me", authAndSetUsersInfo, async (c: Context) => {
  // check if id is set
  const id = c.get("usersId");
  const user = await getDb()
    .select({
      userId: users.id,
      email: users.email,
      firstname: users.firstname,
      surname: users.surname,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, id));

  if (!user || user.length === 0) {
    throw new HTTPException(404, { message: "User not found" });
  } else {
    return c.json(user[0]);
  }
});

/**
 * Update the own user
 */
app.put("/api/v1/user/me", authAndSetUsersInfo, async (c: Context) => {
  const { firstname, surname, image } = await c.req.json();
  const user = await getDb()
    .update(users)
    .set({ firstname, surname, image })
    .where(eq(users.id, c.get("usersId")))
    .returning();
  return c.json(user);
});

/**
 * Login endpoint
 */
app.post("/login", async (c: Context) => {
  try {
    if (AUTH_TYPE !== "local") {
      throw new HTTPException(400, { message: "Local login is not enabled" });
    }
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;
    const r = await LocalAuth.login(email, password);
    return c.json(r);
  } catch (err) {
    throw new HTTPException(401, { message: "Invalid login: " + err });
  }
});

/**
 * Register endpoint
 */
app.post("/register", async (c: Context) => {
  try {
    if (AUTH_TYPE !== "local") {
      throw new HTTPException(400, {
        message: "Local register is not enabled",
      });
    }
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;
    const user = await LocalAuth.register(email, password);
    return c.json(user);
  } catch (err) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
});

/**
 * Search for users by email address
 */
app.get("/api/v1/user/search", authAndSetUsersInfo, async (c: Context) => {
  const email = c.req.query("email");
  if (!email) {
    throw new HTTPException(400, { message: "email is required" });
  }
  const u = await getDb().select().from(users).where(eq(users.email, email));
  if (!u || u.length === 0) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return c.json({
    id: u[0].id,
    email: u[0].email,
    firstname: u[0].firstname,
    surname: u[0].surname,
  });
});

/**
 * Collections endpoint
 */
app.all(
  "/v1/db/collections/:name/:id?",
  authAndSetUsersInfo,
  async (c: Context) => {
    // check if id is set
    const id = c.req.param("id");
    if (!id) {
      if (c.req.method === "GET") {
        return getCollection(c);
      } else if (c.req.method === "POST") {
        return postCollection(c);
      } else {
        throw new HTTPException(405, { message: "Method not allowed" });
      }
    } else {
      if (c.req.method === "GET") {
        return getCollectionById(c);
      } else if (c.req.method === "PUT") {
        return putCollectionById(c);
      } else if (c.req.method === "DELETE") {
        return deleteCollectionById(c);
      } else {
        throw new HTTPException(405, { message: "Method not allowed" });
      }
    }
  }
);

/**
 * Save and serve files that are stored in the database
 */
app.all(
  "/api/v1/files/:type/:bucket/:id?",
  authAndSetUsersInfo,
  async (c: Context) => {
    // check if id is set
    const id = c.req.param("id");
    const type = c.req.param("type");

    if (type !== "local" && type !== "db") {
      throw new HTTPException(400, { message: "Invalid type" });
    }

    if (!id) {
      if (c.req.method === "POST") {
        return FileHander.postFile(c, type);
      } else {
        throw new HTTPException(405, { message: "Method not allowed" });
      }
    } else {
      if (c.req.method === "GET") {
        return FileHander.getFile(c, type);
      } else if (c.req.method === "DELETE") {
        return FileHander.deleteFile(c, type);
      } else {
        throw new HTTPException(405, { message: "Method not allowed" });
      }
    }
  }
);

/**
 * Add all payment routes
 */
if (process.env.USE_STRIPE === "true") {
  const paymentApp = new Hono();
  paymentApp.use("*", async (c, next) => {
    console.log("Payment route", c.req.path);
    if (c.req.path !== "/api/v1/payment/success") {
      return authAndSetUsersInfoOrRedirectToLogin(c, next);
    }
    await next();
  });
  paymentRoutes(paymentApp as any);
  app.route("/api/v1/payment", paymentApp);
}

/**
 * Add custom routes from plugins
 */
async function loadPlugins(app: Hono) {
  const pluginsDir = path.join(__dirname, "../plugins");
  try {
    const files = await fs.readdir(pluginsDir);
    for (const file of files) {
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        const pluginPath = path.join(pluginsDir, file);
        const plugin = await import(pluginPath);
        if (typeof plugin.default === "function") {
          const pluginApp = new Hono();
          pluginApp.use("*", authAndSetUsersInfoOrRedirectToLogin);
          plugin.default(pluginApp);
          app.route("/api/v1/custom", pluginApp);
        }
      }
    }
  } catch (error) {
    console.error("Error loading plugins:", error);
  }
}

// Plugins laden
loadPlugins(app as any);

/**
 * Serve all files from ./static/
 * can be images, html, css, js, etc.
 */
app.use(
  "/static/*",
  authOrRedirectToLogin,
  serveStatic({
    root: "./static",
    rewriteRequestPath: (path) => path.replace(/^\/static/, "/"),
  })
);

/**
 * Serve all files from ./public/
 * can be images, html, css, js, etc.
 */
app.use(
  "/*",
  serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => path.replace(/^\/public/, "/"),
  })
);

/*
--------------------------
Server
--------------------------
*/
export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`Server is running on port http://localhost:${PORT}`);
