'use client';

import { MODAL_TYPES, useModalStore } from '@/stores';
import { PostPreviewDto as PostPreview } from '@repo/dto';
import { Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePosts({ posts }: { posts: PostPreview[] }) {
  const openModal = useModalStore((s) => s.openModal);

  const handleOpenDetail = (postId: string) => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId });
  };

  return (
    <section className="w-full grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6 py-8 border-t border-primary/20">
      {posts.map((post, idx) => {
        return (
          <article key={`${post.postId}-${idx}`} className="group relative cursor-pointer" onClick={() => handleOpenDetail(post.postId)}>
            {post.isMoreThanOneMusic && (
              <>
                <div className="absolute inset-0 bg-gray-4 border-2 border-primary rounded-xl z-0 transform translate-x-1 translate-y-1 transition-transform duration-200"></div>
                <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-xl z-0 transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-200"></div>
              </>
            )}

            <div
              className={`
                    relative z-10 aspect-square rounded-xl overflow-hidden border-2 border-primary bg-gray-4 shadow-sm
                    group-hover:-translate-y-1 transition-transform duration-200
                    ${post.isMoreThanOneMusic ? 'group-hover:-translate-x-1' : ''} 
                `}
            >
              <Image
                src={post.coverImgUrl}
                alt={`사용자 게시물:${post.postId}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white space-y-2">
                <div className="flex items-center space-x-2 font-bold 2xl:text-lg">
                  <Heart className="w-6 h-6 fill-current" />
                  <span>{post.likeCount}</span>
                </div>
                <div className="flex items-center space-x-2 font-bold 2xl:text-lg">
                  <MessageCircle className="w-6 h-6 fill-current" />
                  <span>{post.commentCount}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
