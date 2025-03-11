import { type FastAppHono } from "../../types";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { authAndSetUsersInfo } from "../../lib/utils/hono-middlewares";
import { apiReference } from "@scalar/hono-api-reference";
import widdershins from "widdershins";

export default function defineDocsRoutes(app: FastAppHono, basePath: string) {
  // OpenAPI Docs
  app.get(
    "/api/v1/docs/openapi",
    authAndSetUsersInfo,
    openAPISpecs(app, {
      documentation: {
        info: {
          title: "Symbiosika Backend API",
          version: "1.0.0",
          description: "API for the Symbiosika AI Backend",
        },
      },
    })
  );

  app.get(
    "/api/v1/docs/swagger-ui",
    authAndSetUsersInfo,
    swaggerUI({ url: "/api/v1/docs/openapi" })
  );

  // Add Markdown export endpoint
  app.get("/api/v1/docs.md", authAndSetUsersInfo, async (c, next) => {
    const spec = await openAPISpecs(app, {
      documentation: {
        info: {
          title: "Symbiosika Backend API",
          version: "1.0.0",
          description: "API for the Symbiosika AI Backend",
        },
      },
    })(c, next);

    const options = {
      language_tabs: [{ javascript: "JavaScript", typescript: "TypeScript" }],
      summary: true,
      tocSummary: true,
    };

    const markdown = await widdershins.convert(await spec!.json(), options);
    return c.text(markdown);
  });

  // Add scalar
  app.get(
    "/api/v1/docs/reference",
    authAndSetUsersInfo,
    apiReference({
      pageTitle: "Symbiosika API Reference",
      spec: {
        url: "/api/v1/docs/openapi",
      },
    })
  );
}
