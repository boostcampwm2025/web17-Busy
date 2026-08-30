import { describe, expect, it } from 'vitest';

import { getAuthErrorMessage } from './auth-error-message';

describe('getAuthErrorMessage', () => {
  it('undefined면 기본 메시지를 반환한다', () => {
    expect(getAuthErrorMessage(undefined)).toBe('로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
  });

  it('공백만 있으면 기본 메시지를 반환한다', () => {
    expect(getAuthErrorMessage('   ')).toBe('로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
  });

  it('등록된 코드는 매핑된 메시지를 반환한다', () => {
    expect(getAuthErrorMessage('state_mismatch')).toBe('로그인 세션이 만료됐어요. 다시 시도해주세요.');
  });

  it('등록되지 않은 google_error_* 코드도 공통 메시지로 처리한다', () => {
    // access_denied는 개별 등록돼 있지만, 등록 안 된 다른 코드도 접두어만으로 잡혀야 한다
    expect(getAuthErrorMessage('google_error_invalid_scope')).toBe('Google 로그인에 실패했어요.');
  });

  it('알 수 없는 코드는 기본 메시지로 폴백한다', () => {
    expect(getAuthErrorMessage('never_seen_before')).toBe('로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
  });
});
