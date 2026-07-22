"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionPresets } from "./motion";

type AnimatedIconProps = {
  icon: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
};

export function AnimatedIcon({ icon, className, wrapperClassName }: AnimatedIconProps) {
  return (
    <motion.span
      className={cn("inline-flex items-center justify-center", wrapperClassName)}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      variants={motionPresets.hover}
    >
      <span className={cn("inline-flex", className)}>{icon}</span>
    </motion.span>
  );
}
