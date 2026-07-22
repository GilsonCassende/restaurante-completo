"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionPresets } from "../animations";

export const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        className="inline-flex"
        variants={motionPresets.hover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
      >
        <Button
          ref={ref}
          className={cn(
            "border-0 bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-glow)] hover:brightness-105",
            className
          )}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);
GradientButton.displayName = "GradientButton";
