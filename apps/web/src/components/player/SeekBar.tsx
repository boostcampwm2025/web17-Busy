'use client';

import { useMemo, useRef, useState } from 'react';

type Props = {
  positionMs: number;
  durationMs: number;
  disabled?: boolean;

  /** 드래그 놓을 때 / 클릭 시 최종 seek */
  onSeek: (ms: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function SeekBar({ positionMs, durationMs, disabled = false, onSeek }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draftMs, setDraftMs] = useState(0);

  const effectiveMs = isDragging ? draftMs : positionMs;

  const percent = useMemo(() => {
    if (durationMs <= 0) return 0;
    return clamp((effectiveMs / durationMs) * 100, 0, 100);
  }, [effectiveMs, durationMs]);

  const getMsFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el || durationMs <= 0) return 0;

    const rect = el.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const ratio = rect.width <= 0 ? 0 : x / rect.width;
    return Math.floor(ratio * durationMs);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || durationMs <= 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDraftMs(getMsFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDraftMs(getMsFromClientX(e.clientX));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    onSeek(draftMs);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || durationMs <= 0) return;
    onSeek(getMsFromClientX(e.clientX));
  };

  return (
    <div className="mb-3">
      <div
        ref={trackRef}
        role="slider"
        aria-disabled={disabled}
        aria-valuemin={0}
        aria-valuemax={durationMs}
        aria-valuenow={effectiveMs}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={[
          'w-full bg-gray-3 h-2 rounded-full overflow-hidden border border-primary',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
