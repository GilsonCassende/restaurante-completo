"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionPresets } from "../animations";

type HoverCardProps = React.PropsWithChildren<{
  className?: string;
}>;

export function HoverCard({ className, children }: HoverCardProps) {
  return (
    <motion.div
      className={cn("rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)]", className)}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={motionPresets.hover}
    >
      {children}
    </motion.div>
  );
}
