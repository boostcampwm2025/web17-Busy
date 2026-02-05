'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  text: string;
  className?: string;
  title?: string;
  /** 초/바퀴 */
  durationSec?: number;
  /** 텍스트 사이 간격(px) */
  gapPx?: number;
  /** hover일 때만 재생할지 (데스크탑 기준) */
  playOnHover?: boolean;
};

export default function TickerText({ text, className = '', title, durationSec = 8, gapPx = 24, playOnHover = true }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [overflowed, setOverflowed] = useState(false);
  const [mobileRunning, setMobileRunning] = useState(false);

  const isTouchLike = useMemo(() => {
    if (typeof window === 'undefined') return false;
    // hover가 없거나 coarse pointer면 모바일/태블릿 취급
    return window.matchMedia?.('(hover: none)').matches || window.matchMedia?.('(pointer: coarse)').matches;
  }, []);

  const resetToStart = () => {
    const el = trackRef.current;
    if (!el) return;

    // 애니메이션 끄고 → 다음 프레임에 다시 세팅(= 시작 위치로 리셋)
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = `vibr-ticker ${Math.max(2, durationSec)}s linear infinite`;
      // 데스크탑 hover 모드면 paused 기본, 모바일은 상태에 따라
      el.style.animationPlayState = isTouchLike ? (mobileRunning ? 'running' : 'paused') : playOnHover ? 'paused' : 'running';
    });
  };

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const span = measureRef.current;
      if (!wrap || !span) return;

      const isOverflow = span.scrollWidth > wrap.clientWidth + 4;
      setOverflowed(isOverflow);

      // overflow가 아니면 모바일 토글 상태도 꺼줌
      if (!isOverflow) setMobileRunning(false);
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

  // overflow 아니면 그냥 truncate
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
    <div
      ref={wrapRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      title={title ?? text}
      // 모바일: 탭으로 토글
      onClick={() => {
        if (!isTouchLike) return;
        setMobileRunning((prev) => !prev);
      }}
    >
      <style>{`
        @keyframes vibr-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div
        ref={trackRef}
        className="inline-flex items-center will-change-transform"
        style={{
          animationName: 'vibr-ticker',
          animationDuration: `${Math.max(2, durationSec)}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          // 데스크탑: hover 전용이면 paused 기본 / 모바일: mobileRunning 따라감
          animationPlayState: isTouchLike ? (mobileRunning ? 'running' : 'paused') : playOnHover ? 'paused' : 'running',
          cursor: isTouchLike ? 'pointer' : 'default',
        }}
        // 데스크탑 hover
        onMouseEnter={(e) => {
          if (isTouchLike) return;
          if (!playOnHover) return;
          (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running';
        }}
        onMouseLeave={(e) => {
          if (isTouchLike) return;
          if (!playOnHover) return;

          const el = e.currentTarget as HTMLDivElement;
          el.style.animation = 'none';
          requestAnimationFrame(() => {
            el.style.animation = `vibr-ticker ${Math.max(2, durationSec)}s linear infinite`;
            el.style.animationPlayState = 'paused';
          });
        }}
      >
        <div className="flex items-center" style={{ paddingRight: gapPx }}>
          <span ref={measureRef}>{text}</span>
          <span style={{ width: gapPx, display: 'inline-block' }} />
        </div>

        <div className="flex items-center" aria-hidden="true" style={{ paddingRight: gapPx }}>
          <span>{text}</span>
          <span style={{ width: gapPx, display: 'inline-block' }} />
        </div>
      </div>

      {/* 모바일에서 토글 시, 멈추면 즉시 시작 위치로 리셋 */}
      <MobileResetEffect enabled={isTouchLike} running={mobileRunning} onStop={resetToStart} />
    </div>
  );
}

// running -> false가 되는 순간 resetToStart 호출
function MobileResetEffect({ enabled, running, onStop }: { enabled: boolean; running: boolean; onStop: () => void }) {
  const prevRef = useRef<boolean>(running);

  useEffect(() => {
    if (!enabled) return;

    const prev = prevRef.current;
    prevRef.current = running;

    if (prev === true && running === false) {
      onStop();
    }
  }, [enabled, running, onStop]);

  return null;
}
