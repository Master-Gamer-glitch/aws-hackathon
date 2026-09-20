"use client";

import { useEffect, useState, RefObject } from "react";

interface ScrollProgressResult {
  progress: number;
  isInView: boolean;
}

export function useScrollProgress(
  containerRef: RefObject<HTMLElement>
): ScrollProgressResult {
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollableDistance = rect.height - windowHeight;

      const inView = rect.bottom > 0 && rect.top < windowHeight;
      setIsInView(inView);

      if (totalScrollableDistance <= 0) {
        setProgress(0);
        return;
      }

      const scrolled = -rect.top;
      const rawProgress = scrolled / totalScrollableDistance;
      const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);

      setProgress(clampedProgress);
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [containerRef]);

  return { progress, isInView };
}
