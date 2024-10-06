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
