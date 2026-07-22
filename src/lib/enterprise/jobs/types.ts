export type JobStatus = "queued" | "scheduled" | "running" | "succeeded" | "failed" | "retrying" | "dead_letter";

export type JobPriority = "low" | "normal" | "high";

export type JobHistoryEntry = {
  id: string;
  tenantId: string;
  queue: string;
  jobId: string;
  type: string;
  status: JobStatus;
  attempts: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type JobDefinition<TPayload = unknown, TResult = unknown> = {
  id: string;
  tenantId: string;
  type: string;
  payload: TPayload;
  queue: string;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
  scheduledAt: Date | null;
  availableAt: Date;
  metadata: Record<string, unknown> | null;
  result: TResult | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JobExecutionContext<TPayload = unknown> = {
  job: JobDefinition<TPayload>;
  now: Date;
  attempt: number;
};

export type JobHandler<TPayload = unknown, TResult = unknown> = (context: JobExecutionContext<TPayload>) => Promise<TResult> | TResult;

export type JobRetryStrategy = "exponential" | "linear" | "fixed";

export type JobHistoryQuery = {
  tenantId?: string;
  queue?: string;
  jobId?: string;
  status?: JobStatus;
  type?: string;
};

export type QueueAdapterPushInput<TPayload = unknown> = {
  tenantId: string;
  queue: string;
  type: string;
  payload: TPayload;
  priority?: JobPriority;
  scheduledAt?: Date | null;
  metadata?: Record<string, unknown> | null;
};

export type QueueAdapterPushResult = {
  jobId: string;
  accepted: boolean;
};

export type QueueAdapter = {
  name: string;
  enabled?: boolean;
  push<TPayload>(input: QueueAdapterPushInput<TPayload>): Promise<QueueAdapterPushResult> | QueueAdapterPushResult;
  acknowledge?(jobId: string): Promise<void> | void;
  fail?(jobId: string, reason: string): Promise<void> | void;
  deadLetter?(job: JobDefinition): Promise<void> | void;
};

export type CronJobDefinition = {
  id: string;
  tenantId: string;
  queue: string;
  type?: string | null;
  payload?: unknown;
  priority?: JobPriority;
  everyMs: number;
  nextRunAt: Date;
  enabled: boolean;
  maxAttempts?: number;
  backoffMs?: number;
  metadata: Record<string, unknown> | null;
};

export type JobMetrics = {
  queued: number;
  scheduled: number;
  running: number;
  succeeded: number;
  failed: number;
  retrying: number;
  deadLetter: number;
  perTenant: Record<
    string,
    {
      queued: number;
      scheduled: number;
      running: number;
      succeeded: number;
      failed: number;
      retrying: number;
      deadLetter: number;
    }
  >;
};

export type JobWorkerOptions = {
  queue?: string;
  limit?: number;
  intervalMs?: number;
};

export type JobWorker = {
  name: string;
  isRunning: () => boolean;
  start: (options?: JobWorkerOptions) => Promise<void>;
  stop: () => void;
  runOnce: (limit?: number) => Promise<unknown[]>;
  runUntilIdle: (limit?: number) => Promise<unknown[]>;
};

export type JobSchedulerOptions = {
  intervalMs?: number;
  limit?: number;
};

export type JobScheduler = {
  name: string;
  isRunning: () => boolean;
  start: (options?: JobSchedulerOptions) => Promise<void>;
  stop: () => void;
  runOnce: () => Promise<unknown[]>;
};
