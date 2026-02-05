'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  text: string;
  className?: string;
  title?: string;
  /** 초/바퀴 */
  durationSec?: number;
  /** 텍스트 사이 간격(px) */
  gapPx?: number;
  /** hover일 때만 재생할지 */
  playOnHover?: boolean;
};

export default function TickerText({ text, className = '', title, durationSec = 8, gapPx = 24, playOnHover = true }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  const [overflowed, setOverflowed] = useState(false);

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const span = measureRef.current;
      if (!wrap || !span) return;

      // 실제 텍스트가 컨테이너보다 긴 경우만 ticker 활성화
      const isOverflow = span.scrollWidth > wrap.clientWidth + 4;
      setOverflowed(isOverflow);
    };

    measure();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);

    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [text]);

  // overflow 아니면 그냥 truncate + hover 동작 없음
  if (!overflowed) {
    return (
      <div ref={wrapRef} className={`overflow-hidden whitespace-nowrap ${className}`} title={title ?? text}>
        <span ref={measureRef} className="block truncate">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`overflow-hidden whitespace-nowrap ${className}`} title={title ?? text}>
      <style>{`
        @keyframes vibr-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div
        className="inline-flex items-center will-change-transform"
        style={{
          animationName: 'vibr-ticker',
          animationDuration: `${Math.max(2, durationSec)}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: playOnHover ? 'paused' : 'running',
        }}
        onMouseEnter={(e) => {
          if (!playOnHover) return;
          (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running';
        }}
        onMouseLeave={(e) => {
          if (!playOnHover) return;

          const el = e.currentTarget as HTMLDivElement;
          // hover 해제 시 "처음 위치로 리셋"
          el.style.animation = 'none';
          requestAnimationFrame(() => {
            el.style.animation = `vibr-ticker ${Math.max(2, durationSec)}s linear infinite`;
            el.style.animationPlayState = 'paused';
          });
        }}
      >
        {/* 원본+gap / 복제+gap */}
        <div className="flex items-center" style={{ paddingRight: gapPx }}>
          {/* 측정도 같이 가능하도록 ref를 원본 span에 둬도 됨 */}
          <span ref={measureRef}>{text}</span>
          <span style={{ width: gapPx, display: 'inline-block' }} />
        </div>

        <div className="flex items-center" aria-hidden="true" style={{ paddingRight: gapPx }}>
          <span>{text}</span>
          <span style={{ width: gapPx, display: 'inline-block' }} />
        </div>
      </div>
    </div>
  );
}
