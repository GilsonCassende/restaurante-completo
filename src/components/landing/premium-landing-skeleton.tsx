import { AppShell } from "@/components/layout/app-shell";
import { LoadingSkeleton } from "@/components/design-system";

export function PremiumLandingSkeleton() {
  return (
    <main className="relative overflow-hidden">
      <section className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70" />
        <AppShell className="relative py-6 sm:py-8 lg:py-10">
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-[var(--shadow-card)] sm:p-7 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <LoadingSkeleton className="h-6 w-40" />
                <LoadingSkeleton className="h-14 w-full" />
                <LoadingSkeleton className="h-8 w-4/5" />
                <LoadingSkeleton className="h-20 w-full" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <LoadingSkeleton key={index} className="h-24 rounded-3xl" />
                  ))}
                </div>
              </div>
              <LoadingSkeleton className="h-[28rem] rounded-[1.75rem]" />
            </div>
          </div>
        </AppShell>
      </section>

      <AppShell className="py-14 sm:py-18 lg:py-20">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-40 rounded-[1.75rem]" />
          ))}
        </div>
      </AppShell>

      <AppShell className="py-14 sm:py-18 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <LoadingSkeleton className="h-[24rem] rounded-[1.75rem]" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-28 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
      </AppShell>
    </main>
  );
}

