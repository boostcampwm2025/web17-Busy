import type { CommentItem, Post } from '@/types';

export const buildMockComments = (post: Pick<Post, 'postId'>): CommentItem[] => [
  {
    commentId: `${post.postId}-c1`,
    author: { nickname: '테스터1', profileImgUrl: 'https://picsum.photos/seed/comment-1/100/100' },
    content: '이 노래 도입부 너무 좋네요.',
    createdAtText: '5분 전',
  },
  {
    commentId: `${post.postId}-c2`,
    author: { nickname: '테스터2', profileImgUrl: 'https://picsum.photos/seed/comment-2/100/100' },
    content: '플리에 바로 저장했습니다!',
    createdAtText: '2분 전',
  },
];
