/**
 * Routes to manage the fine-tuning data of the AI models
 * Fine-Tuning data is Q/A pairs that are used to train the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */
import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationMember } from "../../..";
import {
  generateImages,
  imageGenerationValidation,
} from "../../../../../lib/ai/ai-sdk/image";

export default function defineImageRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get fine-tuning data with nested knowledge entry
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/generate-image",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/fine-tuning",
      tags: ["ai"],
      summary: "Get fine-tuning data entries",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  urls: v.array(v.string()),
                  images: v.array(v.string()),
                })
              ),
            },
          },
        },
      },
    }),
    validator("json", imageGenerationValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const organisationId = c.req.valid("param").organisationId;

        const imageGeneration = await generateImages(
          c.req.valid("json").prompt,
          {
            userId,
            organisationId,
          }
        );

        return c.json({
          images: imageGeneration.images.map((image) => {
            return {
              image,
            };
          }),
        });
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );
}
