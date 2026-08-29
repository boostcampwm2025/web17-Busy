import { describe, expect, it } from 'vitest';

import { DEFAULT_VOLUME } from '@/constants/player';
import { normalizeVolume, resolveSeekTarget, shouldRepeatSingle, toDurationMs } from './playback-policy';

describe('toDurationMs', () => {
  it('초를 ms로 내림한다', () => {
    expect(toDurationMs(1.9)).toBe(1900);
  });

  // audio.duration은 메타데이터 로드 전 NaN, 라이브 스트림이면 Infinity가 된다
  it('NaN·Infinity·음수·0은 모두 0으로 눕힌다', () => {
    expect(toDurationMs(Number.NaN)).toBe(0);
    expect(toDurationMs(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toDurationMs(-5)).toBe(0);
    expect(toDurationMs(0)).toBe(0);
  });
});

describe('normalizeVolume', () => {
  it('0~1 범위로 자른다', () => {
    expect(normalizeVolume(0.3)).toBe(0.3);
    expect(normalizeVolume(1.7)).toBe(1);
    expect(normalizeVolume(-0.2)).toBe(0);
  });

  it('숫자가 아니면 기본 볼륨으로 되돌린다', () => {
    expect(normalizeVolume(Number.NaN)).toBe(DEFAULT_VOLUME);
  });
});

describe('resolveSeekTarget', () => {
  it('SDK가 알려준 길이를 우선 쓴다', () => {
    expect(resolveSeekTarget(5_000, 30_000, 10_000)).toEqual({ positionMs: 5_000, durationMs: 30_000 });
  });

  it('SDK 길이를 아직 모르면 지금까지 알던 길이를 쓴다', () => {
    expect(resolveSeekTarget(5_000, 0, 10_000)).toEqual({ positionMs: 5_000, durationMs: 10_000 });
  });

  it('길이를 넘는 요청은 길이까지만 이동한다', () => {
    expect(resolveSeekTarget(99_000, 30_000, 0)).toEqual({ positionMs: 30_000, durationMs: 30_000 });
  });

  // 길이를 모르는 채로 이동하면 어디까지 clamp할지가 정의되지 않는다
  it('길이를 둘 다 모르면 이동하지 않는다', () => {
    expect(resolveSeekTarget(5_000, 0, 0)).toBeNull();
  });
});

describe('shouldRepeatSingle', () => {
  it('큐에 곡이 하나뿐이거나 비어 있으면 반복한다', () => {
    expect(shouldRepeatSingle(1)).toBe(true);
    expect(shouldRepeatSingle(0)).toBe(true);
  });

  it('두 곡 이상이면 다음 곡으로 넘어간다', () => {
    expect(shouldRepeatSingle(2)).toBe(false);
  });
});
