import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePrivacyAgreements } from './use-privacy-agreements';

describe('usePrivacyAgreements', () => {
  it('초기값이 없으면 둘 다 체크 안 된 상태로 시작한다', () => {
    const { result } = renderHook(() => usePrivacyAgreements());

    expect(result.current.agreements).toEqual({ terms: false, privacy: false });
    expect(result.current.isRequiredChecked).toBe(false);
  });

  it('handleCheck은 해당 키만 반전한다', () => {
    const { result } = renderHook(() => usePrivacyAgreements());

    act(() => result.current.handleCheck('terms'));

    expect(result.current.agreements).toEqual({ terms: true, privacy: false });
  });

  it('handleAllCheck은 하나라도 안 되어 있으면 전부 체크한다', () => {
    const { result } = renderHook(() => usePrivacyAgreements({ terms: true, privacy: false }));

    act(() => result.current.handleAllCheck());

    expect(result.current.agreements).toEqual({ terms: true, privacy: true });
  });

  it('handleAllCheck은 이미 전부 체크돼 있으면 전부 해제한다', () => {
    const { result } = renderHook(() => usePrivacyAgreements({ terms: true, privacy: true }));

    act(() => result.current.handleAllCheck());

    expect(result.current.agreements).toEqual({ terms: false, privacy: false });
  });

  /** 제출 버튼 활성화 조건: 초기 상태와 달라졌을 때만 true */
  it('isRequiredChecked는 초기 상태와 달라졌을 때만 true다', () => {
    const { result } = renderHook(() => usePrivacyAgreements({ terms: true, privacy: true }));

    expect(result.current.isRequiredChecked).toBe(false);

    act(() => result.current.handleCheck('privacy'));
    expect(result.current.isRequiredChecked).toBe(true);

    act(() => result.current.handleCheck('privacy'));
    expect(result.current.isRequiredChecked).toBe(false);
  });
});
