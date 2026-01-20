'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { VolumeX, Volume1, Volume2 } from 'lucide-react';

type Props = {
  value: number; // 0~1
  onChange: (value: number) => void;
  disabled?: boolean;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function VolumeControl({ value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const Icon = useMemo(() => {
    if (value <= 0.001) return VolumeX;
    if (value < 0.5) return Volume1;
    return Volume2;
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const onOutside = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };

    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((p) => !p);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(clamp01(Number(e.target.value)));
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* layout 안 밀리게: wrapper는 아이콘 크기만 차지 */}
      <div className="w-5 h-5" />

      {/* pill 전체를 absolute로 띄움(아이콘+슬라이더가 한 덩어리) */}
      <div
        className={[
          'absolute left-0 top-1/2 -translate-y-1/2',
          'rounded-full overflow-hidden',
          'transition-[width,opacity] duration-200 ease-out',
          open ? `w-24 opacity-100` : `w-10 opacity-100`,
          // open/hover일 때만 배경이 생김 (닫힌 기본 상태는 투명)
          open ? 'bg-darkblue/15 backdrop-blur-sm' : 'bg-transparent',
          // hover 시에만 아이콘 색이 primary로 변경
          open ? 'text-primary' : 'text-gray-2 hover:text-primary',
        ].join(' ')}
      >
        <div className="flex items-center">
          {/* 아이콘 버튼: 기본은 배경 없음(요구사항) */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            title="볼륨"
            className="p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon className="w-5 h-5" />
          </button>

          {/* 슬라이더 영역: open일 때만 보이게 */}
          <div
            className={['pr-3', 'transition-opacity duration-200', open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'].join(
              ' ',
            )}
          >
            <div className="relative w-12">
              {/* 트랙(연한 회색, 약간 투명) */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-2" />

              {/* 채움(조금 진한 회색, 약간 투명) */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-1"
                style={{ width: `${Math.round(value * 100)}%` }}
              />

              {/* range */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value}
                onChange={handleChange}
                className="volume-range relative w-full bg-transparent appearance-none cursor-pointer"
                aria-label="volume"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
