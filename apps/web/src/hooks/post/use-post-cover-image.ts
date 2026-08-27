'use client';

import { useCallback, useEffect, useState } from 'react';

export type PostCoverImage = {
  /** 서버로 올릴 파일. 사용자가 고르지 않았으면 null이고, 이때 커버는 첫 곡 앨범아트로 대체된다. */
  coverFile: File | null;
  previewUrl: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
};

/**
 * 커버 이미지 파일 선택과 미리보기 blob URL의 수명을 함께 관리한다.
 *
 * blob URL은 명시적으로 revoke하지 않으면 문서가 살아 있는 동안 계속 남는다.
 */
export function usePostCoverImage(): PostCoverImage {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // 같은 파일 다시 선택 가능하게
    e.target.value = '';
  }, []);

  const reset = useCallback(() => {
    setCoverFile(null);
    setPreviewUrl(null);
  }, []);

  return { coverFile, previewUrl, handleFileChange, reset };
}
