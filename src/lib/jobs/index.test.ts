import { describe, it, expect, beforeAll } from "bun:test";
import {
  createDatabaseClient,
  getDb,
  waitForDbConnection,
} from "../db/db-connection";
import { defineJob, createJob, getJob, startJobQueue } from ".";

describe("Job Queue System", () => {
  beforeAll(async () => {
    await createDatabaseClient();
    await waitForDbConnection();
  });

  it("should execute a job and update the database", async () => {
    // Define a test job handler
    defineJob("test-job", {
      async execute(metadata: any) {
        return { testValue: "completed" };
      },
    });

    // Start the job queue
    startJobQueue();

    // Create and start the job
    const job = await createJob("test-job", { test: true });

    // Wait for job to complete (slightly longer than CHECK_CYCLE_MS)
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Check the job status
    const completedJob = await getJob(job.id);

    expect(completedJob.status).toBe("completed");
    expect(completedJob.result).toEqual({ testValue: "completed" });
  }, 10000); // Increase timeout to allow for job processing
});
