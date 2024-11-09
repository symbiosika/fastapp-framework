import { eq } from "drizzle-orm";
import { jobs, type Job, type JobStatus } from "../db/schema/jobs";
import { getDb } from "../db/db-connection";
import log from "../log";

const CHECK_CYCLE_MS = 5000;

interface JobHandler {
  execute: (metadata: any) => Promise<any>;
  onError?: (error: Error) => Promise<any>;
}

export interface JobHandlerRegister {
  type: string;
  handler: JobHandler;
}

const jobHandlers: Record<string, JobHandler> = {};

export function defineJob(type: string, handler: JobHandler) {
  jobHandlers[type] = handler;
}

async function processJob(job: Job) {
  await log.debug(`Executing job: ${job.id} from type ${job.type}`);

  const executor = jobHandlers[job.type];
  if (!executor) {
    try {
      await log.debug(
        `No executor found for job type: ${job.type} and id: ${job.id}`
      );
      await getDb()
        .update(jobs)
        .set({
          status: "failed",
          error: { message: `No executor found for job type: ${job.type}` },
        })
        .where(eq(jobs.id, job.id));
    } catch (error) {
      log.error(`Error updating jobId ${job.id} status: ${error}`);
    }
    throw new Error(`No executor found for job type: ${job.type}`);
  }

  // update the job status to running
  await getDb()
    .update(jobs)
    .set({ status: "running" })
    .where(eq(jobs.id, job.id));

  try {
    const result = await executor.execute(job.metadata);
    log.debug(
      `Job ${job.id} from type ${job.type} completed ${result != null ? "with result" : "without result"}`
    );
    // complete the job
    await getDb()
      .update(jobs)
      .set({ status: "completed", result })
      .where(eq(jobs.id, job.id));
  } catch (e) {
    // if there is an error, we need to update the job status to failed
    if (executor.onError) {
      await executor.onError(e as Error);
    } else {
      log.error(`Error executing job: ${job.id} from type ${job.type}: ${e}`);
      getDb()
        .update(jobs)
        .set({ status: "failed", error: { message: (e as Error).message } })
        .where(eq(jobs.id, job.id));
    }
  }
}

export async function startJobQueue() {
  setInterval(async () => {
    // log.debug("Checking for pending jobs");
    const pendingJobs = await getDb()
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"));

    for (const job of pendingJobs) {
      await processJob(job);
    }
  }, CHECK_CYCLE_MS);
}

export async function getJob(id: string) {
  const res = await getDb().select().from(jobs).where(eq(jobs.id, id));
  if (res.length === 0) {
    throw new Error(`Job with id ${id} not found`);
  }
  return res[0];
}

export async function createJob(type: string, metadata: any) {
  const res = await getDb()
    .insert(jobs)
    .values({ type, metadata, status: "pending" })
    .returning();
  return res[0];
}

/*
..in index.ts use "startJobQueue" to register the job queue
import { startJobQueue } from "../lib/jobs";
startJobQueue();

// to register new job handlers:
import { defineJob } from "../lib/jobQueue";

defineJob("render-video", {
  async execute(metadata: any) {    
    // Simulate a long-running task
    await new Promise(resolve => setTimeout(resolve, 10000));
    return { test: true };
  }
});

// Get the status of a job
GET /api/v1/collections/jobs/:id

// POST a new job
POST /api/v1/collections/jobs

// GET all jobs
GET /api/v1/collections/jobs?query=(userId eq "user_id")
*/
