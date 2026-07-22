import "server-only";

import { randomUUID } from "node:crypto";
import type {
  CronJobDefinition,
  JobDefinition,
  JobHandler,
  JobHistoryEntry,
  JobHistoryQuery,
  JobMetrics,
  JobPriority,
  JobScheduler,
  JobSchedulerOptions,
  JobStatus,
  JobWorker,
  JobWorkerOptions,
  QueueAdapter,
  QueueAdapterPushInput,
} from "./types";

type JobEnvelope = JobDefinition<unknown, unknown> & {
  handlerName?: string | null;
};

type QueueStore = {
  jobs: JobEnvelope[];
  history: JobHistoryEntry[];
  cronJobs: CronJobDefinition[];
  deadLetters: JobEnvelope[];
  handlers: Map<string, JobHandler>;
};

function now() {
  return new Date();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 12)}`;
}

function priorityRank(priority: JobPriority) {
  switch (priority) {
    case "high":
      return 0;
    case "normal":
      return 1;
    case "low":
    default:
      return 2;
  }
}

function toBackoffDelay(baseMs: number, attempt: number) {
  return Math.max(baseMs, 250) * 2 ** Math.max(attempt - 1, 0);
}

function sortJobs(items: JobEnvelope[]) {
  return [...items].sort((a, b) => {
    const priorityDelta = priorityRank(a.priority) - priorityRank(b.priority);
    if (priorityDelta !== 0) return priorityDelta;
    return a.availableAt.getTime() - b.availableAt.getTime();
  });
}

function createHistoryEntry(
  job: JobEnvelope,
  status: JobStatus,
  metadata?: Record<string, unknown> | null,
  error?: string | null
): JobHistoryEntry {
  return {
    id: createId("hist"),
    tenantId: job.tenantId,
    queue: job.queue,
    jobId: job.id,
    type: job.type,
    status,
    attempts: job.attempts,
    scheduledAt: job.scheduledAt,
    startedAt: status === "running" ? now() : null,
    finishedAt: status === "succeeded" || status === "failed" || status === "dead_letter" ? now() : null,
    error: error ?? null,
    metadata: metadata ?? null,
    createdAt: now(),
  };
}

function createStore(): QueueStore {
  return {
    jobs: [],
    history: [],
    cronJobs: [],
    deadLetters: [],
    handlers: new Map(),
  };
}

const stores = new Map<string, QueueStore>();

function getStore(queue: string) {
  const current = stores.get(queue);
  if (current) return current;
  const store = createStore();
  stores.set(queue, store);
  return store;
}

export function createQueueAdapter(name: string): QueueAdapter {
  return {
    name,
    enabled: true,
    push(_input) {
      void _input;
      return {
        jobId: createId("job"),
        accepted: true,
      };
    },
  };
}

export function createBullMqQueueAdapter() {
  return createQueueAdapter("bullmq");
}

export function createRabbitMqQueueAdapter() {
  return createQueueAdapter("rabbitmq");
}

export function createSqsQueueAdapter() {
  return createQueueAdapter("sqs");
}

export function createRedisQueueAdapter() {
  return createQueueAdapter("redis");
}

export function createJobQueueManager(queue = "default", adapter: QueueAdapter = createQueueAdapter("memory")) {
  const store = getStore(queue);

  function registerHandler(type: string, handler: JobHandler) {
    store.handlers.set(type, handler);
    return handler;
  }

  async function enqueue<TPayload>(
    input: Omit<QueueAdapterPushInput<TPayload>, "queue"> & { queue?: string; maxAttempts?: number; backoffMs?: number }
  ) {
    const targetQueue = input.queue ?? queue;
    const targetStore = getStore(targetQueue);
    const job: JobEnvelope = {
      id: createId("job"),
      tenantId: input.tenantId,
      type: input.type,
      payload: input.payload,
      queue: targetQueue,
      priority: input.priority ?? "normal",
      status: input.scheduledAt ? "scheduled" : "queued",
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 5,
      backoffMs: input.backoffMs ?? 1000,
      scheduledAt: input.scheduledAt ?? null,
      availableAt: input.scheduledAt ?? now(),
      metadata: input.metadata ?? null,
      result: null,
      error: null,
      createdAt: now(),
      updatedAt: now(),
    };

    targetStore.jobs.push(job);
    targetStore.history.push(createHistoryEntry(job, job.status, job.metadata));
    await adapter.push({
      tenantId: job.tenantId,
      queue: job.queue,
      type: job.type,
      payload: job.payload,
      priority: job.priority,
      scheduledAt: job.scheduledAt,
      metadata: job.metadata,
    });
    return job;
  }

  async function scheduleCron(input: Omit<CronJobDefinition, "id" | "nextRunAt"> & { nextRunAt?: Date }) {
    const cron: CronJobDefinition = {
      id: createId("cron"),
      tenantId: input.tenantId,
      queue: input.queue,
      type: input.type ?? null,
      payload: input.payload ?? null,
      priority: input.priority ?? "normal",
      everyMs: input.everyMs,
      nextRunAt: input.nextRunAt ?? new Date(Date.now() + input.everyMs),
      enabled: input.enabled,
      maxAttempts: input.maxAttempts ?? 1,
      backoffMs: input.backoffMs ?? 0,
      metadata: input.metadata ?? null,
    };
    store.cronJobs.push(cron);
    return cron;
  }

  async function runNextJob() {
    const job = sortJobs(store.jobs).find((item) => item.availableAt.getTime() <= Date.now() && item.status !== "dead_letter");
    if (!job) {
      return null;
    }

    const handler = store.handlers.get(job.type);
    if (!handler) {
      return null;
    }

    job.status = "running";
    job.attempts += 1;
    job.updatedAt = now();
    store.history.push(createHistoryEntry(job, "running", job.metadata));

    try {
      const result = await handler({
        job,
        now: now(),
        attempt: job.attempts,
      });
      job.result = result;
      job.status = "succeeded";
      job.error = null;
      job.updatedAt = now();
      store.history.push(createHistoryEntry(job, "succeeded", { result: job.result as Record<string, unknown> | null }, null));
      await adapter.acknowledge?.(job.id);
      return job;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job failed.";
      job.error = message;
      if (job.attempts < job.maxAttempts) {
        job.status = "retrying";
        job.availableAt = new Date(Date.now() + toBackoffDelay(job.backoffMs, job.attempts));
        job.updatedAt = now();
        store.history.push(createHistoryEntry(job, "retrying", job.metadata, message));
        await adapter.fail?.(job.id, message);
        return job;
      }

      job.status = "dead_letter";
      job.updatedAt = now();
      store.history.push(createHistoryEntry(job, "dead_letter", job.metadata, message));
      store.deadLetters.push(job);
      await adapter.deadLetter?.(job);
      return job;
    }
  }

  async function runDueJobs(limit = 25) {
    const executed: JobEnvelope[] = [];
    for (let index = 0; index < limit; index += 1) {
      const next = await runNextJob();
      if (!next) break;
      executed.push(next);
    }
    return executed;
  }

  async function runCronJobs() {
    const executed: CronJobDefinition[] = [];
    const nowDate = now();
    for (const cron of store.cronJobs) {
      if (!cron.enabled || cron.nextRunAt.getTime() > nowDate.getTime()) continue;
      const handlerKey = cron.type ?? cron.queue;
      const handler = store.handlers.get(handlerKey);
      if (handler) {
        await handler({
          job: {
            id: createId("cronjob"),
            tenantId: cron.tenantId,
            type: handlerKey,
            payload: cron.payload ?? { cron: cron.id },
            queue: cron.queue,
            priority: cron.priority ?? "normal",
            status: "running",
            attempts: 1,
            maxAttempts: cron.maxAttempts ?? 1,
            backoffMs: cron.backoffMs ?? 0,
            scheduledAt: cron.nextRunAt,
            availableAt: cron.nextRunAt,
            metadata: cron.metadata,
            result: null,
            error: null,
            createdAt: nowDate,
            updatedAt: nowDate,
          },
          now: nowDate,
          attempt: 1,
        });
      }
      cron.nextRunAt = new Date(nowDate.getTime() + cron.everyMs);
      executed.push(cron);
    }
    return executed;
  }

  function getHistory(tenantId?: string) {
    return store.history.filter((entry) => !tenantId || entry.tenantId === tenantId).slice().reverse();
  }

  function getDeadLetters(tenantId?: string) {
    return store.deadLetters.filter((job) => !tenantId || job.tenantId === tenantId).slice().reverse();
  }

  function getJobs(tenantId?: string) {
    return sortJobs(store.jobs).filter((job) => !tenantId || job.tenantId === tenantId);
  }

  function findJobs(query: JobHistoryQuery = {}) {
    return getJobs(query.tenantId).filter((job) => {
      if (query.queue && job.queue !== query.queue) return false;
      if (query.jobId && job.id !== query.jobId) return false;
      if (query.status && job.status !== query.status) return false;
      if (query.type && job.type !== query.type) return false;
      return true;
    });
  }

  function clearTenant(tenantId: string) {
    store.jobs = store.jobs.filter((job) => job.tenantId !== tenantId);
    store.history = store.history.filter((entry) => entry.tenantId !== tenantId);
    store.cronJobs = store.cronJobs.filter((cron) => cron.tenantId !== tenantId);
    store.deadLetters = store.deadLetters.filter((job) => job.tenantId !== tenantId);
  }

  function getMetrics(): JobMetrics {
    const base = {
      queued: 0,
      scheduled: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
      deadLetter: 0,
    };
    const perTenant: JobMetrics["perTenant"] = {};

    for (const job of store.jobs) {
      const key = job.tenantId;
      const tenant = perTenant[key] ?? { ...base };
      const statusKey = job.status === "dead_letter" ? "deadLetter" : job.status;
      tenant[statusKey] += 1;
      perTenant[key] = tenant;
      base[statusKey] += 1;
    }

    return {
      ...base,
      perTenant,
    };
  }

  return {
    registerHandler,
    enqueue,
    scheduleCron,
    runNextJob,
    runDueJobs,
    runCronJobs,
    getHistory,
    getDeadLetters,
    getJobs,
    findJobs,
    clearTenant,
    getMetrics,
    get jobs() {
      return sortJobs(store.jobs);
    },
    get cronJobs() {
      return [...store.cronJobs];
    },
    get deadLetters() {
      return [...store.deadLetters];
    },
    get adapter() {
      return adapter;
    },
  };
}

export type JobQueueManager = ReturnType<typeof createJobQueueManager>;

function createWorkerRunner(queueManager: JobQueueManager, name: string, options?: JobWorkerOptions): JobWorker {
  let running = false;
  let timer: NodeJS.Timeout | null = null;

  async function runOnce(limit = options?.limit ?? 25) {
    return queueManager.runDueJobs(limit);
  }

  async function runUntilIdle(limit = options?.limit ?? 25) {
    const executed: unknown[] = [];
    while (true) {
      const next = await queueManager.runDueJobs(limit);
      if (next.length === 0) break;
      executed.push(...next);
    }
    return executed;
  }

  return {
    name,
    isRunning: () => running,
    async start(startOptions?: JobWorkerOptions) {
      if (running) return;
      running = true;
      const intervalMs = startOptions?.intervalMs ?? options?.intervalMs ?? 1000;
      const limit = startOptions?.limit ?? options?.limit ?? 25;
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(() => {
        void queueManager.runDueJobs(limit).catch(() => undefined);
      }, intervalMs);
      await queueManager.runDueJobs(limit);
    },
    stop() {
      running = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    runOnce,
    runUntilIdle,
  };
}

function createSchedulerRunner(queueManager: JobQueueManager, name: string, options?: JobSchedulerOptions): JobScheduler {
  let running = false;
  let timer: NodeJS.Timeout | null = null;

  return {
    name,
    isRunning: () => running,
    async start(startOptions?: JobSchedulerOptions) {
      if (running) return;
      running = true;
      const intervalMs = startOptions?.intervalMs ?? options?.intervalMs ?? 1000;
      const limit = startOptions?.limit ?? options?.limit ?? 25;
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(() => {
        void queueManager
          .runCronJobs()
          .then(() => queueManager.runDueJobs(limit))
          .catch(() => undefined);
      }, intervalMs);
      await queueManager.runCronJobs();
      await queueManager.runDueJobs(limit);
    },
    stop() {
      running = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    async runOnce() {
      const cronJobs = await queueManager.runCronJobs();
      await queueManager.runDueJobs(options?.limit ?? 25);
      return cronJobs;
    },
  };
}

export function createJobWorker(queueManager: JobQueueManager, name = "worker", options?: JobWorkerOptions) {
  return createWorkerRunner(queueManager, name, options);
}

export function createJobScheduler(queueManager: JobQueueManager, name = "scheduler", options?: JobSchedulerOptions) {
  return createSchedulerRunner(queueManager, name, options);
}
