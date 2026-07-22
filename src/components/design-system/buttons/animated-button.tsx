"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button, type ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTransition } from "../animations";

export interface AnimatedButtonProps extends ButtonProps {
  motionClassName?: string;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, motionClassName, ...props }, ref) => {
    return (
      <motion.div
        className={cn("inline-flex", motionClassName)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={motionTransition}
      >
        <Button ref={ref} className={className} {...props} />
      </motion.div>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

export { buttonVariants };
