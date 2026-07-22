import { LoadingSkeleton, SectionContainer } from "@/components/design-system";

export default function Loading() {
  return (
    <SectionContainer className="space-y-6 py-2">
      <LoadingSkeleton variant="dashboard" />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    </SectionContainer>
  );
}

