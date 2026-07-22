export type ResourceHint = {
  href: string;
  as?: "script" | "style" | "font" | "image" | "fetch" | "document";
  crossOrigin?: "anonymous" | "use-credentials";
  rel: "preconnect" | "preload" | "prefetch" | "dns-prefetch";
  type?: string;
};

export type PerformancePlan = {
  streaming: boolean;
  partialRendering: boolean;
  suspenseReady: boolean;
  lazyImports: boolean;
  codeSplitting: boolean;
  bundleOptimization: boolean;
  imageOptimization: boolean;
  fontOptimization: boolean;
  scriptOptimization: boolean;
  resourceHints: ResourceHint[];
};

export type PerformanceOptimizationTarget = "streaming" | "partial-rendering" | "suspense" | "lazy-imports" | "code-splitting" | "bundle" | "image" | "font" | "script";
