import type { Hono } from "hono";
import type { BlankSchema } from "hono/types";

/* 
alternative: 
interface ExtendedContext extends Context {
  get(key: "usersId"): string | undefined;
  get(key: "usersEmail"): string | undefined;
  get(key: "usersRoles"): string[] | undefined;

+ HonoBase Interface for app
} */

interface BaseHonoApp
  extends Hono<
    {
      Variables: {
        usersId: string;
        usersEmail: string;
        usersRoles: string[];
      };
    },
    BlankSchema,
    "/"
  > {}

// this function will be ankered to /api/v1/custom/test:
export default function defineRoutes(app: BaseHonoApp) {
  app.get("/test", async (c) => {
    const usersEmail = c.get("usersEmail");
    return c.text("Hallo, " + usersEmail);
  });
}
