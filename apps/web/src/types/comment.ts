export type CommentItem = {
  commentId: string;
  author: {
    nickname: string;
    profileImgUrl: string;
  };
  content: string;
  createdAtText: string;
};
