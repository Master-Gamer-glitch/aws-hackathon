"use client";

import React, { useEffect, useRef } from 'react';
import { paintCastPortrait, type OfficeCharacterName } from '@/live-office/scene/office/cast';
import { PORTRAIT_W, PORTRAIT_H } from '@/live-office/scene/office/portraitArt';

const FRAME_W = PORTRAIT_W;
const FRAME_H = PORTRAIT_H;

export interface SpritePortraitProps {
  character: OfficeCharacterName;
  scale?: number;
  background?: string;
  className?: string;
}

/** Static standing portrait of an Office cast member (procedural pixel art). */
export function SpritePortrait({
  character,
  scale = 2,
  background = 'transparent',
  className = '',
}: SpritePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (background !== 'transparent') {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    paintCastPortrait(ctx, character, scale).catch(() => {
      /* ignore load race */
    });
  }, [character, scale, background]);

  const w = Math.round(FRAME_W * scale);
  const h = Math.round(FRAME_H * scale);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      className={className}
      style={{
        width: w,
        height: h,
        imageRendering: 'pixelated',
      }}
    />
  );
}
