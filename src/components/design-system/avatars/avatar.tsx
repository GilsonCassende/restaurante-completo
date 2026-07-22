import Image from "next/image";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileAvatar({ name, src, size = "md", className }: ProfileAvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full border border-border/70 bg-gradient-to-br from-primary/15 to-secondary/30 font-semibold text-foreground",
        sizeClasses[size],
        className
      )}
    >
      {src ? <Image src={src} alt={name} fill sizes="48px" className="object-cover" /> : initials(name)}
    </div>
  );
}
