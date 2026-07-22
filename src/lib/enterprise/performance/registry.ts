import type { PerformanceOptimizationTarget, PerformancePlan, ResourceHint } from "./types";

export function buildResourceHints(input: {
  siteUrl: string;
  cdnUrl?: string | null;
  fontUrls?: string[];
  scriptUrls?: string[];
  imageUrls?: string[];
}): ResourceHint[] {
  const hints: ResourceHint[] = [];

  if (input.cdnUrl) {
    hints.push({ rel: "preconnect", href: input.cdnUrl, crossOrigin: "anonymous" });
    hints.push({ rel: "dns-prefetch", href: input.cdnUrl });
  }

  for (const fontUrl of input.fontUrls ?? []) {
    hints.push({ rel: "preload", href: fontUrl, as: "font", crossOrigin: "anonymous" });
  }

  for (const scriptUrl of input.scriptUrls ?? []) {
    hints.push({ rel: "preload", href: scriptUrl, as: "script" });
  }

  for (const imageUrl of input.imageUrls ?? []) {
    hints.push({ rel: "prefetch", href: imageUrl, as: "image" });
  }

  hints.push({ rel: "preconnect", href: input.siteUrl, crossOrigin: "anonymous" });
  return hints;
}

export function createPerformancePlan(input: {
  siteUrl: string;
  cdnUrl?: string | null;
  fontUrls?: string[];
  scriptUrls?: string[];
  imageUrls?: string[];
}): PerformancePlan {
  return {
    streaming: true,
    partialRendering: true,
    suspenseReady: true,
    lazyImports: true,
    codeSplitting: true,
    bundleOptimization: true,
    imageOptimization: true,
    fontOptimization: true,
    scriptOptimization: true,
    resourceHints: buildResourceHints(input),
  };
}

export function listPerformanceTargets(): PerformanceOptimizationTarget[] {
  return [
    "streaming",
    "partial-rendering",
    "suspense",
    "lazy-imports",
    "code-splitting",
    "bundle",
    "image",
    "font",
    "script",
  ];
}

export function isPerformanceTargetReady(target: PerformanceOptimizationTarget) {
  return listPerformanceTargets().includes(target);
}
