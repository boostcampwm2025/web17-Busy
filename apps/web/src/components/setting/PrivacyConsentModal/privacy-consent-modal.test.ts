import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';

const formRenders = vi.hoisted(() => ({ count: 0 }));

// 부모가 리렌더되면 memo 없는 자식도 함께 리렌더되므로, 자식 렌더 횟수를 부모의 대리 지표로 쓴다.
vi.mock('./PrivacyConsentForm', () => ({
  PrivacyConsentForm: () => {
    formRenders.count += 1;
    return null;
  },
}));

import { PrivacyConsentModal } from './PrivacyConsentModal';

describe('PrivacyConsentModal store subscription', () => {
  beforeEach(() => {
    formRenders.count = 0;
    useModalStore.getState().closeModal();
  });

  /**
   * 이 컴포넌트가 쓰는 건 closeModal 하나뿐이다.
   * 스토어 전체를 구조분해하면 다른 모달이 열릴 때마다 같이 리렌더된다.
   */
  it('does not re-render when unrelated modal state changes', () => {
    render(createElement(PrivacyConsentModal));
    expect(formRenders.count).toBe(1);

    act(() => {
      useModalStore.getState().openModal(MODAL_TYPES.LOGIN, { authError: 'session_expired' });
    });

    expect(formRenders.count).toBe(1);
  });

  it('still closes the modal through the selected action', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    useModalStore.getState().openModal(MODAL_TYPES.PRIVACY_CONCENT);
    render(createElement(PrivacyConsentModal));

    await userEvent.click(screen.getByRole('button'));

    expect(useModalStore.getState().isOpen).toBe(false);
  });
});
