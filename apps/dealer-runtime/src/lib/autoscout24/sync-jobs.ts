import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  deleteAutoScoutListingByIdentity,
  deleteAutoScoutListingForCar,
  patchAutoScoutPublicationForCar,
  syncCarToAutoScout,
  type AutoScoutSyncResult,
} from "./sync";
import {
  autoScoutSyncJobDedupeKey,
  desiredAutoScoutPublicationAction,
  supersededAutoScoutActions,
  type AutoScoutSyncJobAction,
} from "./sync-job-policy";

export type { AutoScoutSyncJobAction } from "./sync-job-policy";

export type AutoScoutSyncJobInput = {
  carId?: string | null;
  action: AutoScoutSyncJobAction;
  customerId?: string | null;
  listingId?: string | null;
  crossReferenceId?: string | null;
  priority?: number;
  maxAttempts?: number;
  nextRunAt?: Date;
  dedupeKey?: string;
  resetAttempts?: boolean;
};

export type AutoScoutSyncQueueSummary = {
  processed: number;
  succeeded: number;
  skipped: number;
  retrying: number;
  failed: number;
  errors: string[];
};

const LOCK_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 5;
const DEFAULT_FINISHED_JOB_RETENTION_DAYS = 30;
const DEFAULT_LOG_RETENTION_DAYS = 90;
const BACKOFF_MS = [
  60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
];

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds);
}

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : value as Prisma.InputJsonValue;
}

function pendingCarStatus(action: AutoScoutSyncJobAction) {
  return action === "delete" ? "pending-delete" : "pending";
}

function buildDedupeKey(input: AutoScoutSyncJobInput) {
  if (input.dedupeKey) return input.dedupeKey;
  return autoScoutSyncJobDedupeKey(input) ?? `autoscout:${input.action}:${randomUUID()}`;
}

function isActivelyRunning(job: { status: string; lockedUntil: Date | null } | null, now: Date) {
  return job?.status === "running" && Boolean(job.lockedUntil && job.lockedUntil > now);
}

async function availableDedupeKey(baseDedupeKey: string, now: Date) {
  const current = await prisma.autoScoutSyncJob.findUnique({
    where: { dedupeKey: baseDedupeKey },
    select: { status: true, lockedUntil: true },
  });
  if (!isActivelyRunning(current, now)) return baseDedupeKey;

  const followUpDedupeKey = `${baseDedupeKey}:follow-up`;
  const followUp = await prisma.autoScoutSyncJob.findUnique({
    where: { dedupeKey: followUpDedupeKey },
    select: { status: true, lockedUntil: true },
  });
  return isActivelyRunning(followUp, now)
    ? `${followUpDedupeKey}:${randomUUID()}`
    : followUpDedupeKey;
}

function retryDelay(attempt: number) {
  return BACKOFF_MS[Math.min(Math.max(attempt - 1, 0), BACKOFF_MS.length - 1)];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function shouldRetry(message: string) {
  if (/HTTP 40[0134]\b|invalid-json|ontbreekt|ongeldig|validatiefout|validation/i.test(message)) {
    return false;
  }

  return /HTTP (408|409|425|429|5\d\d)\b|fetch failed|network|timeout|timed out|ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket|rate/i
    .test(message);
}

async function markCarSyncFailed(carId: string | null | undefined, message: string) {
  if (!carId) return;
  await prisma.car.update({
    where: { id: carId },
    data: {
      autoscoutSyncStatus: "failed",
      autoscoutSyncError: message.slice(0, 5000),
    },
  }).catch(() => undefined);
}

async function markCarSyncRetrying(
  carId: string | null | undefined,
  action: AutoScoutSyncJobAction,
  message: string,
) {
  if (!carId) return;
  await prisma.car.update({
    where: { id: carId },
    data: {
      autoscoutSyncStatus: pendingCarStatus(action),
      autoscoutSyncError: message.slice(0, 5000),
    },
  }).catch(() => undefined);
}

async function writeLog(input: {
  jobId?: string | null;
  carId?: string | null;
  action: AutoScoutSyncJobAction;
  status: string;
  attempt?: number | null;
  message?: string | null;
  payloadHash?: string | null;
  customerId?: string | null;
  listingId?: string | null;
  responsePayload?: unknown;
  errorPayload?: unknown;
}) {
  await prisma.autoScoutSyncLog.create({
    data: {
      jobId: input.jobId ?? null,
      carId: input.carId ?? null,
      action: input.action,
      status: input.status,
      attempt: input.attempt ?? null,
      message: input.message?.slice(0, 5000) ?? null,
      payloadHash: input.payloadHash ?? null,
      customerId: input.customerId ?? null,
      listingId: input.listingId ?? null,
      responsePayload: input.responsePayload === undefined ? undefined : jsonValue(input.responsePayload),
      errorPayload: input.errorPayload === undefined ? undefined : jsonValue(input.errorPayload),
    },
  });
}

export async function enqueueAutoScoutSyncJob(input: AutoScoutSyncJobInput) {
  const now = new Date();
  const dedupeKey = await availableDedupeKey(buildDedupeKey(input), now);
  const maxAttempts = input.maxAttempts ?? 5;

  if (input.carId) {
    await cancelPendingAutoScoutSyncJobsForCar(
      input.carId,
      "Superseded by a newer AutoScout24 sync request.",
      {
        actions: supersededAutoScoutActions(input.action),
        excludeDedupeKey: dedupeKey,
      },
    );
  }

  const job = await prisma.autoScoutSyncJob.upsert({
    where: { dedupeKey },
    create: {
      carId: input.carId ?? null,
      action: input.action,
      status: "pending",
      priority: input.priority ?? 0,
      attempts: 0,
      maxAttempts,
      nextRunAt: input.nextRunAt ?? now,
      dedupeKey,
      customerId: input.customerId ?? null,
      listingId: input.listingId ?? null,
      crossReferenceId: input.crossReferenceId ?? null,
      lockedAt: null,
      lockedUntil: null,
      finishedAt: null,
      lastError: null,
    },
    update: {
      carId: input.carId ?? undefined,
      action: input.action,
      status: "pending",
      priority: input.priority ?? 0,
      maxAttempts,
      nextRunAt: input.nextRunAt ?? now,
      customerId: input.customerId ?? undefined,
      listingId: input.listingId ?? undefined,
      crossReferenceId: input.crossReferenceId ?? undefined,
      lockedAt: null,
      lockedUntil: null,
      finishedAt: null,
      lastError: null,
      ...(input.resetAttempts ? { attempts: 0 } : {}),
    },
  });

  if (input.carId) {
    await prisma.car.update({
      where: { id: input.carId },
      data: {
        autoscoutSyncStatus: pendingCarStatus(input.action),
        autoscoutSyncError: null,
      },
    }).catch(() => undefined);
  }

  return job;
}

export async function cancelPendingAutoScoutSyncJobsForCar(
  carId: string,
  message = "AutoScout24 sync uitgeschakeld voor dit voertuig.",
  options: {
    actions?: AutoScoutSyncJobAction[];
    excludeDedupeKey?: string;
  } = {},
) {
  const now = new Date();
  const jobs = await prisma.autoScoutSyncJob.findMany({
    where: {
      carId,
      finishedAt: null,
      status: { in: ["pending", "failed"] },
      ...(options.actions ? { action: { in: options.actions } } : {}),
      ...(options.excludeDedupeKey ? { NOT: { dedupeKey: options.excludeDedupeKey } } : {}),
    },
    select: {
      id: true,
      action: true,
      attempts: true,
      payloadHash: true,
      customerId: true,
      listingId: true,
    },
  });

  if (jobs.length === 0) return 0;

  await prisma.autoScoutSyncJob.updateMany({
    where: { id: { in: jobs.map((job) => job.id) } },
    data: {
      status: "cancelled",
      finishedAt: now,
      lockedAt: null,
      lockedUntil: null,
      lastError: message,
    },
  });

  await Promise.all(jobs.map((job) => writeLog({
    jobId: job.id,
    carId,
    action: job.action as AutoScoutSyncJobAction,
    status: "cancelled",
    attempt: job.attempts,
    message,
    payloadHash: job.payloadHash,
    customerId: job.customerId,
    listingId: job.listingId,
  })));

  return jobs.length;
}

async function claimNextJob(now: Date) {
  const candidates = await prisma.autoScoutSyncJob.findMany({
    where: {
      nextRunAt: { lte: now },
      finishedAt: null,
      OR: [
        { status: { in: ["pending", "failed"] } },
        { status: "running", lockedUntil: { lt: now } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
    take: 20,
  });

  for (const candidate of candidates) {
    if (candidate.carId) {
      const runningForCar = await prisma.autoScoutSyncJob.findFirst({
        where: {
          id: { not: candidate.id },
          carId: candidate.carId,
          status: "running",
          lockedUntil: { gt: now },
        },
        select: { id: true },
      });
      if (runningForCar) continue;
    }

    if (candidate.attempts >= candidate.maxAttempts) {
      const message = candidate.lastError ?? "AutoScout24 sync failed after maximum attempts.";
      await prisma.autoScoutSyncJob.update({
        where: { id: candidate.id },
        data: {
          status: "failed",
          finishedAt: now,
          lockedAt: null,
          lockedUntil: null,
          lastError: message,
        },
      });
      await markCarSyncFailed(candidate.carId, message);
      await writeLog({
        jobId: candidate.id,
        carId: candidate.carId,
        action: candidate.action as AutoScoutSyncJobAction,
        status: "failed",
        attempt: candidate.attempts,
        message,
        payloadHash: candidate.payloadHash,
        customerId: candidate.customerId,
        listingId: candidate.listingId,
      });
      continue;
    }

    const claimed = await prisma.autoScoutSyncJob.updateMany({
      where: {
        id: candidate.id,
        nextRunAt: { lte: now },
        finishedAt: null,
        OR: [
          { status: { in: ["pending", "failed"] } },
          { status: "running", lockedUntil: { lt: now } },
        ],
      },
      data: {
        status: "running",
        lockedAt: now,
        lockedUntil: addMilliseconds(now, LOCK_MS),
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    if (claimed.count === 1) {
      return prisma.autoScoutSyncJob.findUnique({ where: { id: candidate.id } });
    }
  }

  return null;
}

async function runJobAction(job: NonNullable<Awaited<ReturnType<typeof claimNextJob>>>): Promise<AutoScoutSyncResult> {
  switch (job.action as AutoScoutSyncJobAction) {
    case "upsert":
      if (!job.carId) return { ok: false, message: "AutoScout24 sync job mist een voertuig-ID." };
      return syncCarToAutoScout(job.carId);
    case "set-publication":
    case "set-active":
    case "set-inactive":
      if (!job.carId) return { ok: false, message: "AutoScout24 publicatiejob mist een voertuig-ID." };
      const car = await prisma.car.findUnique({
        where: { id: job.carId },
        select: { sold: true, reserved: true },
      });
      if (!car) return { ok: false, message: "Voertuig niet gevonden." };
      const desiredAction = desiredAutoScoutPublicationAction(car);
      return desiredAction === "delete"
        ? deleteAutoScoutListingForCar(job.carId)
        : patchAutoScoutPublicationForCar(job.carId, desiredAction);
    case "delete":
      if (job.listingId || job.crossReferenceId) {
        return deleteAutoScoutListingByIdentity({
          customerId: job.customerId,
          listingId: job.listingId,
          crossReferenceId: job.crossReferenceId,
        });
      }
      if (!job.carId) return { ok: false, message: "AutoScout24 verwijderjob mist een voertuig-ID of listing-ID." };
      return deleteAutoScoutListingForCar(job.carId);
    default:
      return { ok: false, message: `Onbekende AutoScout24 sync actie: ${job.action}` };
  }
}

async function processClaimedJob(
  job: NonNullable<Awaited<ReturnType<typeof claimNextJob>>>,
  summary: AutoScoutSyncQueueSummary,
) {
  summary.processed += 1;

  try {
    const result = await runJobAction(job);
    if (!result.ok) {
      throw new Error(result.message ?? "AutoScout24 sync failed.");
    }

    const status = result.action === "skipped" ? "skipped" : "succeeded";
    const now = new Date();
    await prisma.autoScoutSyncJob.update({
      where: { id: job.id },
      data: {
        status,
        finishedAt: now,
        lockedAt: null,
        lockedUntil: null,
        lastError: null,
        payloadHash: result.payloadHash ?? job.payloadHash,
        listingId: result.listingId ?? job.listingId,
      },
    });

    await writeLog({
      jobId: job.id,
      carId: job.carId,
      action: job.action as AutoScoutSyncJobAction,
      status,
      attempt: job.attempts,
      message: result.action ?? status,
      payloadHash: result.payloadHash ?? job.payloadHash,
      customerId: job.customerId,
      listingId: result.listingId ?? job.listingId,
      responsePayload: result,
    });

    if (status === "skipped") {
      summary.skipped += 1;
    } else {
      summary.succeeded += 1;
    }
  } catch (error) {
    const message = errorMessage(error);
    const retrying = shouldRetry(message) && job.attempts < job.maxAttempts;
    const now = new Date();

    await prisma.autoScoutSyncJob.update({
      where: { id: job.id },
      data: {
        status: retrying ? "pending" : "failed",
        nextRunAt: retrying ? addMilliseconds(now, retryDelay(job.attempts)) : now,
        finishedAt: retrying ? null : now,
        lockedAt: null,
        lockedUntil: null,
        lastError: message.slice(0, 5000),
      },
    });

    if (retrying) {
      await markCarSyncRetrying(job.carId, job.action as AutoScoutSyncJobAction, message);
    } else {
      await markCarSyncFailed(job.carId, message);
    }

    await writeLog({
      jobId: job.id,
      carId: job.carId,
      action: job.action as AutoScoutSyncJobAction,
      status: retrying ? "retrying" : "failed",
      attempt: job.attempts,
      message,
      payloadHash: job.payloadHash,
      customerId: job.customerId,
      listingId: job.listingId,
      errorPayload: { message },
    });

    if (retrying) {
      summary.retrying += 1;
    } else {
      summary.failed += 1;
      summary.errors.push(message);
    }
  }
}

export async function processAutoScoutSyncJobs(options: { limit?: number } = {}): Promise<AutoScoutSyncQueueSummary> {
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_LIMIT, 25));
  const summary: AutoScoutSyncQueueSummary = {
    processed: 0,
    succeeded: 0,
    skipped: 0,
    retrying: 0,
    failed: 0,
    errors: [],
  };

  for (let index = 0; index < limit; index += 1) {
    const job = await claimNextJob(new Date());
    if (!job) break;
    await processClaimedJob(job, summary);
  }

  return summary;
}

function daysBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function cleanupAutoScoutSyncHistory(options: {
  now?: Date;
  finishedJobRetentionDays?: number;
  logRetentionDays?: number;
} = {}) {
  const now = options.now ?? new Date();
  const finishedJobCutoff = daysBefore(now, options.finishedJobRetentionDays ?? DEFAULT_FINISHED_JOB_RETENTION_DAYS);
  const logCutoff = daysBefore(now, options.logRetentionDays ?? DEFAULT_LOG_RETENTION_DAYS);

  const [logs, jobs] = await prisma.$transaction([
    prisma.autoScoutSyncLog.deleteMany({
      where: { createdAt: { lt: logCutoff } },
    }),
    prisma.autoScoutSyncJob.deleteMany({
      where: {
        finishedAt: { lt: finishedJobCutoff },
      },
    }),
  ]);

  return {
    logsDeleted: logs.count,
    jobsDeleted: jobs.count,
    finishedJobCutoff,
    logCutoff,
  };
}
