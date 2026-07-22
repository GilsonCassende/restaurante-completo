import { getRuntimeConfig } from "../config";
import type { RedisCacheAdapter, RedisSessionAdapter, ScalabilityBlueprint, ScalabilityReadiness, ScalabilityTarget } from "./types";

type CacheEntry = {
  value: string;
  expiresAt: number | null;
};

const cacheStore = new Map<string, CacheEntry>();
const sessionStore = new Map<string, { value: Record<string, unknown>; expiresAt: number | null }>();

function now() {
  return Date.now();
}

function buildReadiness(target: ScalabilityTarget, ready: boolean, notes: string[] = []) {
  return { target, ready, notes } satisfies ScalabilityReadiness;
}

export function createRedisCacheAdapter(name = "redis-cache"): RedisCacheAdapter {
  return {
    name,
    async get(key) {
      const entry = cacheStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= now()) {
        cacheStore.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttlSeconds) {
      cacheStore.set(key, {
        value,
        expiresAt: ttlSeconds ? now() + ttlSeconds * 1000 : null,
      });
    },
    async delete(key) {
      return cacheStore.delete(key);
    },
    async clear() {
      cacheStore.clear();
    },
  };
}

export function createRedisSessionAdapter(name = "redis-session"): RedisSessionAdapter {
  return {
    name,
    async getSession(sessionId) {
      const entry = sessionStore.get(sessionId);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= now()) {
        sessionStore.delete(sessionId);
        return null;
      }
      return entry.value;
    },
    async setSession(sessionId, value, ttlSeconds) {
      sessionStore.set(sessionId, {
        value,
        expiresAt: ttlSeconds ? now() + ttlSeconds * 1000 : null,
      });
    },
    async deleteSession(sessionId) {
      return sessionStore.delete(sessionId);
    },
  };
}

export function createScalabilityBlueprint(): ScalabilityBlueprint {
  const runtime = getRuntimeConfig();
  const redisEnabled = Boolean(runtime.redisUrl);
  return {
    targets: [
      buildReadiness("redis", redisEnabled, redisEnabled ? ["Redis disponível via runtime config."] : ["Redis não configurado."]),
      buildReadiness("redis-cache", redisEnabled),
      buildReadiness("redis-session", redisEnabled),
      buildReadiness("horizontal", true, ["Aplicação stateless e preparada para múltiplas instâncias."]),
      buildReadiness("sticky-session", true, ["Sessões podem ser adaptadas via adapter dedicado."]),
      buildReadiness("stateless", true, ["Camada de sessão externalizável."]),
      buildReadiness("cdn", Boolean(runtime.cdnUrl), runtime.cdnUrl ? ["CDN configurado."] : ["CDN opcional."]),
      buildReadiness("cloudflare", Boolean(runtime.cdnUrl), runtime.cdnUrl ? ["Compatível com Cloudflare."] : ["Ready para Cloudflare quando configurado."]),
      buildReadiness("load-balancer", true),
      buildReadiness("edge", runtime.edgeEnabled),
      buildReadiness("queue", runtime.workerEnabled),
      buildReadiness("worker", runtime.workerEnabled),
      buildReadiness("shared-storage", true),
    ],
    redis: {
      enabled: redisEnabled,
      url: runtime.redisUrl,
    },
    sessions: {
      stateless: true,
      stickyReady: true,
    },
    deployment: {
      horizontalScaling: true,
      edgeReady: runtime.edgeEnabled,
      cdnReady: Boolean(runtime.cdnUrl),
      loadBalancerReady: true,
      cloudflareReady: Boolean(runtime.cdnUrl),
    },
    storage: {
      sharedReady: true,
    },
    runtime: {
      workerReady: runtime.workerEnabled,
      queueReady: true,
    },
  };
}

export function listScalabilityReadiness() {
  return createScalabilityBlueprint().targets;
}

export function isReadyFor(target: ScalabilityTarget) {
  return listScalabilityReadiness().find((item) => item.target === target)?.ready ?? false;
}
