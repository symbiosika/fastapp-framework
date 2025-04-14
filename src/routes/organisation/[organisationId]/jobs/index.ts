/**
 * Routes to manage jobs of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import { HTTPException } from "../../../../types";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import {
  createJob,
  getJob,
  getJobsByOrganisation,
  updateJobProgress,
  cancelJob,
} from "../../../../lib/jobs";
import type { FastAppHono } from "../../../../types";
import { jobsSelectSchema } from "../../../../lib/db/schema/jobs";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { RESPONSES } from "../../../../lib/responses";
import { getDb } from "../../../../lib/db/db-connection";
import { jobs } from "../../../../lib/db/schema/jobs";
import { eq } from "drizzle-orm";
import { isOrganisationMember } from "../..";
import { validateScope } from "../../../../lib/utils/validate-scope";

/**
 * Define the job management routes
 */
export default function defineJobRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get all jobs for an organisation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/jobs",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/jobs",
      tags: ["jobs"],
      summary: "Get all jobs for an organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(jobsSelectSchema)),
            },
          },
        },
      },
    }),
    validateScope("jobs:read"),
    validator("param", v.object({ organisationId: v.string() })),
    validator(
      "query",
      v.object({
        status: v.optional(v.string()),
        type: v.optional(v.string()),
        limit: v.optional(v.string()),
        offset: v.optional(v.string()),
        sortBy: v.optional(v.string()),
        sortOrder: v.optional(v.string()),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const { status, type, limit, offset } = c.req.valid("query");

        const userId = c.get("usersId");

        // Use the new getJobsByOrganisation function
        const result = await getJobsByOrganisation(organisationId, {
          status: status as any,
          type,
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        });

        return c.json(result);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get jobs",
        });
      }
    }
  );

  /**
   * Get a specific job by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/jobs/:jobId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/jobs/:jobId",
      tags: ["jobs"],
      summary: "Get a specific job by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(jobsSelectSchema),
            },
          },
        },
        404: {
          description: "Job not found",
        },
      },
    }),
    validateScope("jobs:read"),
    validator(
      "param",
      v.object({ organisationId: v.string(), jobId: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, jobId } = c.req.valid("param");

        const job = await getJob(jobId);

        // Check if job belongs to the organisation
        if (job.organisationId !== organisationId) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        return c.json(job);
      } catch (error) {
        if ((error as Error).message.includes("not found")) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        throw new HTTPException(500, {
          message: "Failed to get job",
        });
      }
    }
  );

  /**
   * Create a new job
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/jobs",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/jobs",
      tags: ["jobs"],
      summary: "Create a new job",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(jobsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("jobs:write"),
    validator(
      "json",
      v.object({
        type: v.string(),
        metadata: v.optional(v.any()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const { type, metadata } = c.req.valid("json");
        const userId = c.get("usersId");

        // Create the job
        const job = await createJob(type, metadata || {}, organisationId);

        // Update the job with the user ID
        await getDb().update(jobs).set({ userId }).where(eq(jobs.id, job.id));

        // Get the updated job
        const updatedJob = await getJob(job.id);

        return c.json(updatedJob);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to create job: " + (error as Error).message,
        });
      }
    }
  );

  /**
   * Cancel a job
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/jobs/:jobId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/jobs/:jobId",
      tags: ["jobs"],
      summary: "Cancel a job",
      responses: {
        200: {
          description: "Successful response",
        },
        404: {
          description: "Job not found",
        },
      },
    }),
    validateScope("jobs:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), jobId: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, jobId } = c.req.valid("param");

        // Check if job exists and belongs to the organisation
        const job = await getJob(jobId);

        if (job.organisationId !== organisationId) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        // Use the new cancelJob function
        await cancelJob(jobId);

        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        if ((error as Error).message.includes("not found")) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        if ((error as Error).message.includes("Only pending or running jobs")) {
          throw new HTTPException(400, {
            message: (error as Error).message,
          });
        }

        throw new HTTPException(500, {
          message: "Failed to cancel job: " + (error as Error).message,
        });
      }
    }
  );

  /**
   * Update job progress
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/jobs/:jobId/progress",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/jobs/:jobId/progress",
      tags: ["jobs"],
      summary: "Update job progress",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(jobsSelectSchema),
            },
          },
        },
        404: {
          description: "Job not found",
        },
      },
    }),
    validateScope("jobs:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), jobId: v.string() })
    ),
    validator(
      "json",
      v.object({
        progress: v.number(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, jobId } = c.req.valid("param");
        const { progress } = c.req.valid("json");

        // Check if job exists and belongs to the organisation
        const job = await getJob(jobId);

        if (job.organisationId !== organisationId) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        // Use the new updateJobProgress function
        const updatedJob = await updateJobProgress(jobId, progress);

        return c.json(updatedJob);
      } catch (error) {
        if ((error as Error).message.includes("not found")) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        throw new HTTPException(500, {
          message: "Failed to update job progress: " + (error as Error).message,
        });
      }
    }
  );

  /**
   * Get job status
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/jobs/:jobId/status",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/jobs/:jobId/status",
      tags: ["jobs"],
      summary: "Get job status",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  status: v.string(),
                  progress: v.optional(v.number()),
                })
              ),
            },
          },
        },
        404: {
          description: "Job not found",
        },
      },
    }),
    validateScope("jobs:read"),
    validator(
      "param",
      v.object({ organisationId: v.string(), jobId: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, jobId } = c.req.valid("param");

        const job = await getJob(jobId);

        // Check if job belongs to the organisation
        if (job.organisationId !== organisationId) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        // Extract progress from metadata if available
        const progress =
          job.metadata && typeof job.metadata === "object"
            ? (job.metadata as any).progress
            : undefined;

        return c.json({
          status: job.status,
          progress,
        });
      } catch (error) {
        if ((error as Error).message.includes("not found")) {
          throw new HTTPException(404, {
            message: "Job not found",
          });
        }

        throw new HTTPException(500, {
          message: "Failed to get job status",
        });
      }
    }
  );
}
