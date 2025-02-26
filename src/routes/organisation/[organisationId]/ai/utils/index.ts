import { textToSpeech, speechToText } from "../../../../../lib/ai/standard";
import type { FastAppHono } from "../../../../../types";
import { HTTPException } from "hono/http-exception";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationMember } from "../../..";

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Text to Speech endpoint
   * Converts text to speech using OpenAI's TTS API
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/utils/tts",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/utils/tts",
      tags: ["ai-utils"],
      summary: "Convert text to speech",
      responses: {
        200: {
          description: "Send Audio file in MP3 format",
          content: {
            "audio/mp3": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        text: v.string(),
        voice: v.optional(
          v.union([
            v.literal("alloy"),
            v.literal("echo"),
            v.literal("fable"),
            v.literal("onyx"),
            v.literal("nova"),
            v.literal("shimmer"),
          ])
        ),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { text, voice } = c.req.valid("json");
        const result = await textToSpeech(text, voice ?? "alloy");

        return new Response(result.file, {
          headers: {
            "Content-Type": "audio/mp3",
            "Content-Disposition": `attachment; filename="${result.filename}"`,
          },
        });
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Speech to Text endpoint
   * Converts speech to text using OpenAI's Whisper API
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/utils/stt",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/utils/stt",
      tags: ["ai-utils"],
      summary: "Convert speech to text",
      responses: {
        200: {
          description: "Transcription result",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  text: v.string(),
                  segments: v.optional(
                    v.array(
                      v.object({
                        start: v.number(),
                        end: v.number(),
                        text: v.string(),
                      })
                    )
                  ),
                  words: v.optional(
                    v.array(
                      v.object({
                        word: v.string(),
                        start: v.number(),
                        end: v.number(),
                      })
                    )
                  ),
                })
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    validator(
      "form",
      v.object({
        file: v.any(),
        returnSegments: v.optional(v.string()),
        returnWords: v.optional(v.string()),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { file, returnSegments, returnWords } = c.req.valid("form");
        const audioFile = file as File;

        if (!audioFile) {
          throw new Error("No audio file provided");
        }

        const result = await speechToText({
          file: audioFile,
          returnSegments: returnSegments === "true",
          returnWords: returnWords === "true",
        });

        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
