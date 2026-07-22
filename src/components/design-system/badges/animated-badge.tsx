"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { motionTransition } from "../animations";

export function AnimatedBadge(props: BadgeProps) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={motionTransition}>
      <Badge {...props} />
    </motion.div>
  );
}
