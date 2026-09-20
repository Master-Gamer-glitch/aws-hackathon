"use client";

import { useEffect, useState, useRef } from "react";

interface PreloadOptions {
  fileNamePattern?: string;
  customFiles?: string[];
  lazy?: boolean;
}

interface ImagePreloaderResult {
  images: HTMLImageElement[];
  imagesRef: React.MutableRefObject<HTMLImageElement[]>;
  progress: number;
  isLoaded: boolean;
  hasError: boolean;
}

// Global cache across hook instances
const globalImageCache = new Map<string, HTMLImageElement>();

export function useImagePreloader(
  sequencePath: string,
  frameCount: number,
  options?: PreloadOptions
): ImagePreloaderResult {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const totalCount = options?.customFiles ? options.customFiles.length : frameCount;
    const loadedImages: HTMLImageElement[] = new Array(totalCount);
    imagesRef.current = loadedImages;
    let completedCount = 0;

    if (totalCount === 0) {
      setIsLoaded(true);
      setProgress(100);
      return;
    }

    const normalizedPath = sequencePath.endsWith("/")
      ? sequencePath
      : `${sequencePath}/`;

    const getFrameUrl = (index: number): string => {
      if (options?.customFiles && options.customFiles[index]) {
        return `${normalizedPath}${options.customFiles[index]}`;
      }
      const padNum = String(index + 1).padStart(3, "0");
      return `${normalizedPath}frame-${padNum}.jpg`;
    };

    let lastUpdatePct = -1;

    const updateStatus = () => {
      if (isCancelled) return;
      const pct = Math.round((completedCount / totalCount) * 100);
      // Throttle React state updates to avoid unnecessary renders
      if (pct >= 100 || pct - lastUpdatePct >= 5 || completedCount === 1) {
        lastUpdatePct = pct;
        setProgress(pct);
        setImages([...loadedImages]);
      }
      if (completedCount >= totalCount) {
        setIsLoaded(true);
      }
    };

    for (let i = 0; i < totalCount; i++) {
      const src = getFrameUrl(i);

      if (globalImageCache.has(src)) {
        const cached = globalImageCache.get(src)!;
        loadedImages[i] = cached;
        completedCount++;
      } else {
        const img = new Image();
        img.src = src;

        img.onload = () => {
          if (isCancelled) return;
          globalImageCache.set(src, img);
          loadedImages[i] = img;
          completedCount++;
          updateStatus();
        };

        img.onerror = () => {
          if (isCancelled) return;
          // Try fallback ezgif-frame naming if standard failed
          if (src.includes("frame-") && src.includes("sequence-1")) {
            const fallbackSrc = src.replace("frame-", "ezgif-frame-");
            const fallbackImg = new Image();
            fallbackImg.src = fallbackSrc;
            fallbackImg.onload = () => {
              if (isCancelled) return;
              globalImageCache.set(src, fallbackImg);
              loadedImages[i] = fallbackImg;
              completedCount++;
              updateStatus();
            };
            fallbackImg.onerror = () => {
              if (isCancelled) return;
              setHasError(true);
              completedCount++;
              updateStatus();
            };
            return;
          }

          setHasError(true);
          completedCount++;
          updateStatus();
        };
      }
    }

    // Initial check in case everything was already cached
    updateStatus();

    return () => {
      isCancelled = true;
    };
  }, [sequencePath, frameCount, options?.customFiles]);

  return { images, imagesRef, progress, isLoaded, hasError };
}
