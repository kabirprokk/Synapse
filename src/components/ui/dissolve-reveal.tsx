/**
 * DissolveReveal — Synarena-original scroll reveal inspired by scroll-dissolve
 * patterns (blur + rise + fade via IntersectionObserver, zero deps).
 * Deliberately NOT a copy of any vendor component.
 */

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DissolveRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export const DissolveReveal: React.FC<DissolveRevealProps> = ({ children, className, delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out will-change-transform", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        filter: visible ? "blur(0)" : "blur(6px)",
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default DissolveReveal;
