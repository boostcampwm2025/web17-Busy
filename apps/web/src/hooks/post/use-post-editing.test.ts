import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mutationMocks = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('@/hooks/post/use-post-mutations', () => ({
  useUpdatePostMutation: () => ({ mutateAsync: mutationMocks.mutateAsync }),
}));
vi.mock('react-toastify', () => ({ toast: toastMock }));

import { usePostEditing } from './use-post-editing';

const ORIGINAL = '원본 본문';

const renderEditing = (overrides: Partial<Parameters<typeof usePostEditing>[0]> = {}) =>
  renderHook(() =>
    usePostEditing({
      postId: 'post-1',
      content: ORIGINAL,
      initialIsEditing: false,
      initialContent: '',
      ...overrides,
    }),
  );

describe('usePostEditing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mutationMocks.mutateAsync.mockResolvedValue(undefined);
  });

  it('opens with the current content when editing starts', () => {
    const { result } = renderEditing();

    act(() => result.current.handleStartEdit());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editedContent).toBe(ORIGINAL);
  });

  it('can open straight into editing with a prefilled draft', () => {
    const { result } = renderEditing({ initialIsEditing: true, initialContent: '작성 중' });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editedContent).toBe('작성 중');
  });

  /** 내용이 그대로면 저장 요청을 보낼 이유가 없다. 버튼도 이 값으로 잠근다. */
  it('disables saving while the draft equals the original content', () => {
    const { result } = renderEditing();
    act(() => result.current.handleStartEdit());

    expect(result.current.isSaveDisabled).toBe(true);

    act(() => result.current.setEditedContent('바뀐 본문'));

    expect(result.current.isSaveDisabled).toBe(false);
  });

  it('does not send a request when the draft is unchanged', async () => {
    const { result } = renderEditing();
    act(() => result.current.handleStartEdit());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mutationMocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('sends the draft and leaves edit mode on success', async () => {
    const { result } = renderEditing();
    act(() => result.current.handleStartEdit());
    act(() => result.current.setEditedContent('바뀐 본문'));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mutationMocks.mutateAsync).toHaveBeenCalledWith('바뀐 본문');
    expect(result.current.isEditing).toBe(false);
    expect(toastMock.success).toHaveBeenCalledTimes(1);
  });

  /** 저장이 실패했는데 편집 모드를 닫으면 사용자가 쓰던 내용이 사라진다. */
  it('stays in edit mode and keeps the draft when saving fails', async () => {
    mutationMocks.mutateAsync.mockRejectedValue(new Error('save failed'));
    const { result } = renderEditing();
    act(() => result.current.handleStartEdit());
    act(() => result.current.setEditedContent('바뀐 본문'));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editedContent).toBe('바뀐 본문');
    expect(result.current.isSaving).toBe(false);
    expect(toastMock.error).toHaveBeenCalledTimes(1);
  });

  it('restores the original content on cancel', () => {
    const { result } = renderEditing();
    act(() => result.current.handleStartEdit());
    act(() => result.current.setEditedContent('버릴 내용'));

    act(() => result.current.handleCancelEdit());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editedContent).toBe(ORIGINAL);
  });

  it('does not send a request without a postId', async () => {
    const { result } = renderEditing({ postId: undefined });
    act(() => result.current.setEditedContent('바뀐 본문'));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mutationMocks.mutateAsync).not.toHaveBeenCalled();
  });
});
