"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
};

export function AnimatedCounter({ value, suffix = "", className, duration = 1.6 }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 110, damping: 24, mass: 1 });
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, motionValue, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(Math.round(latest).toLocaleString("pt-BR"));
  });

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)} animate={{}} transition={{ duration }}>
      {display}
      {suffix}
    </motion.span>
  );
}
