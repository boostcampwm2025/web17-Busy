import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePostCoverImage } from './use-post-cover-image';

const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();

const changeEvent = (files: File[]) => {
  const target = { files, value: 'C:\\fakepath\\cover.png' };
  return { target } as unknown as React.ChangeEvent<HTMLInputElement>;
};

const FILE = new File(['x'], 'cover.png', { type: 'image/png' });

describe('usePostCoverImage', () => {
  beforeEach(() => {
    createObjectURL.mockReset().mockReturnValue('blob:preview-1');
    revokeObjectURL.mockReset();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the picked file and its preview url together', () => {
    const { result } = renderHook(() => usePostCoverImage());

    act(() => result.current.handleFileChange(changeEvent([FILE])));

    expect(result.current.coverFile).toBe(FILE);
    expect(result.current.previewUrl).toBe('blob:preview-1');
  });

  /** 같은 파일을 다시 고를 수 있어야 하므로 input value를 비운다. 안 비우면 change 이벤트가 안 뜬다. */
  it('clears the input value so the same file can be picked again', () => {
    const { result } = renderHook(() => usePostCoverImage());
    const event = changeEvent([FILE]);

    act(() => result.current.handleFileChange(event));

    expect(event.target.value).toBe('');
  });

  it('ignores a change event with no file', () => {
    const { result } = renderHook(() => usePostCoverImage());

    act(() => result.current.handleFileChange(changeEvent([])));

    expect(result.current.coverFile).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  /** blob URL은 revoke하지 않으면 문서가 살아 있는 동안 남는다. */
  it('revokes the preview url on unmount', () => {
    const { result, unmount } = renderHook(() => usePostCoverImage());
    act(() => result.current.handleFileChange(changeEvent([FILE])));

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
  });

  it('revokes the previous preview url when another file replaces it', () => {
    const { result } = renderHook(() => usePostCoverImage());
    act(() => result.current.handleFileChange(changeEvent([FILE])));

    createObjectURL.mockReturnValue('blob:preview-2');
    act(() => result.current.handleFileChange(changeEvent([new File(['y'], 'other.png')])));

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    expect(result.current.previewUrl).toBe('blob:preview-2');
  });

  it('drops both file and preview on reset', () => {
    const { result } = renderHook(() => usePostCoverImage());
    act(() => result.current.handleFileChange(changeEvent([FILE])));

    act(() => result.current.reset());

    expect(result.current.coverFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
  });
});
