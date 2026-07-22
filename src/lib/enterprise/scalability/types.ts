export type ScalabilityTarget =
  | "redis"
  | "redis-cache"
  | "redis-session"
  | "horizontal"
  | "sticky-session"
  | "stateless"
  | "cdn"
  | "cloudflare"
  | "load-balancer"
  | "edge"
  | "queue"
  | "worker"
  | "shared-storage";

export type ScalabilityReadiness = {
  target: ScalabilityTarget;
  ready: boolean;
  notes?: string[];
};

export type ScalabilityBlueprint = {
  targets: ScalabilityReadiness[];
  redis: {
    enabled: boolean;
    url: string | null;
  };
  sessions: {
    stateless: boolean;
    stickyReady: boolean;
  };
  deployment: {
    horizontalScaling: boolean;
    edgeReady: boolean;
    cdnReady: boolean;
    loadBalancerReady: boolean;
    cloudflareReady: boolean;
  };
  storage: {
    sharedReady: boolean;
  };
  runtime: {
    workerReady: boolean;
    queueReady: boolean;
  };
};

export type RedisCacheAdapter = {
  name: string;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
};

export type RedisSessionAdapter = {
  name: string;
  getSession: (sessionId: string) => Promise<Record<string, unknown> | null>;
  setSession: (sessionId: string, value: Record<string, unknown>, ttlSeconds?: number) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;
};
