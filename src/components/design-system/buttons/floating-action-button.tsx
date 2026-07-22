"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { motionPresets } from "../animations";

type FloatingActionButtonProps = {
  icon?: React.ReactNode;
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function FloatingActionButton({ className, icon, label, children, ...props }: FloatingActionButtonProps) {
  return (
    <motion.button
      type={props.type ?? "button"}
      aria-label={props.ariaLabel ?? label}
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "fixed bottom-6 right-6 z-50 h-14 rounded-full px-5 shadow-[var(--shadow-float)]",
        className
      )}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={motionPresets.hover}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        <span>{children ?? label}</span>
      </span>
    </motion.button>
  );
}
