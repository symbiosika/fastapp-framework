import type { Hono } from "hono";
import type { BlankSchema } from "hono/types";

export interface FastAppHono
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

/* 
alternative: 
interface ExtendedContext extends Context {
  get(key: "usersId"): string | undefined;
  get(key: "usersEmail"): string | undefined;
  get(key: "usersRoles"): string[] | undefined;

+ HonoBase Interface for app
} */
