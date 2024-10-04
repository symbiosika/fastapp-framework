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
    return c.redirect("/login");
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
      return c.redirect("/login");
    }
  } catch (err) {
    return c.redirect("/login");
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
  const user = await getDb().select().from(users).where(eq(users.id, id));

  if (!user || user.length === 0) {
    throw new HTTPException(404, { message: "User not found" });
  } else {
    return c.json(user[0]);
  }
});

/**
 * GET login page
 * publish a static html page from ./static/login.html
 */
const loginPage = await fs.readFile("./static/login.html", "utf8");
app.get("/login", async (c) => {
  return c.html(loginPage);
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
    throw new HTTPException(401, { message: "Invalid login" });
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
 * Funktion zum dynamischen Laden der Plugins
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
    console.error("Fehler beim Laden der Plugins:", error);
  }
}

// Plugins laden
loadPlugins(app as any);

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
