import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

import { copyPostLink } from './share-post-link';

const writeText = vi.fn();

describe('copyPostLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies an absolute post url', async () => {
    writeText.mockResolvedValue(undefined);

    await expect(copyPostLink('post-1')).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/post/post-1`);
    expect(toastMock.success).toHaveBeenCalledTimes(1);
  });

  /** 클립보드 거부는 흔하다(권한 거부·비보안 컨텍스트). 호출부로 예외가 새면 안 된다. */
  it('reports failure instead of rejecting when the clipboard denies the write', async () => {
    writeText.mockRejectedValue(new Error('denied'));

    await expect(copyPostLink('post-1')).resolves.toBe(false);

    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
