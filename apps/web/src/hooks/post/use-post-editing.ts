'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

import { useUpdatePostMutation } from '@/hooks/post/use-post-mutations';

type Params = {
  postId?: string;
  /** 저장 기준이 되는 원본 본문. 취소·변경 여부 판정에 쓴다. */
  content: string;
  initialIsEditing: boolean;
  initialContent: string;
};

export type PostEditing = {
  isEditing: boolean;
  editedContent: string;
  setEditedContent: (v: string) => void;
  isSaving: boolean;
  isSaveDisabled: boolean;
  handleStartEdit: () => void;
  handleSave: () => Promise<void>;
  handleCancelEdit: () => void;
};

/** 게시글 상세의 인라인 본문 수정 상태. */
export function usePostEditing({ postId, content, initialIsEditing, initialContent }: Params): PostEditing {
  const updatePostMutation = useUpdatePostMutation({ postId: postId ?? '' });

  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [editedContent, setEditedContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const isSaveDisabled = isSaving || editedContent === content;

  const handleStartEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!postId || isSaveDisabled) return; // 내용 변경 없으면 저장 안 함

    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync(editedContent);
      toast.success('게시글을 수정했습니다.');
      setIsEditing(false);
    } catch (err) {
      toast.error('게시글 수정에 실패했습니다.');
      console.error('게시글 수정 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(content); // 원본 content로 되돌리기
  };

  return { isEditing, editedContent, setEditedContent, isSaving, isSaveDisabled, handleStartEdit, handleSave, handleCancelEdit };
}
