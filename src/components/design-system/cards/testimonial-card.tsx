import { Quote } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "../avatars";

type TestimonialCardProps = {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string | null;
  className?: string;
};

export function TestimonialCard({ quote, name, role, company, avatar, className }: TestimonialCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/95 shadow-[var(--shadow-soft)]", className)}>
      <CardHeader className="space-y-4">
        <Quote className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg leading-7">{quote}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <ProfileAvatar name={name} src={avatar ?? undefined} size="sm" />
          <div>
            <p className="font-medium text-foreground">{name}</p>
            <p>{[role, company].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
