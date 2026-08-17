import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository, LessThan } from 'typeorm';
import { Post } from './entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  // 좋아요 수 증가
  async incrementLikeCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;

    await repo.increment({ id: postId }, 'likeCount', 1);
  }

  // 좋아요 수 감소
  async decrementLikeCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;

    await repo.decrement({ id: postId }, 'likeCount', 1);
  }
  // 게시글 존재 여부 확인
  async findPostById(
    postId: string,
    manager?: EntityManager,
  ): Promise<Post | null> {
    const repo = manager ? manager.getRepository(Post) : this.repository;
    return repo.findOne({ where: { id: postId } });
  }

  // 댓글 수 증가
  async incrementCommentCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;
    await repo.increment({ id: postId }, 'commentCount', 1);
  }

  // 댓글 수 감소
  async decrementCommentCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;
    await repo.decrement({ id: postId }, 'commentCount', 1);
  }

  // 유저 모든 글 조회
  async getPostsByUser(
    userId: string,
    take: number,
    cursorDate: Date | null,
  ): Promise<Post[]> {
    return await this.repository.find({
      where: this.buildUserPostsWhere(userId, cursorDate),
      relations: {
        postMusics: true,
      },
      select: {
        id: true,
        coverImgUrl: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        postMusics: {
          id: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: take,
    });
  }

  /**
   * 유저 글 조회. 카드 렌더링에 필요한 작성자와 음악까지 한 번에 가져온다.
   * 게시글 수와 무관하게 쿼리 수가 일정하도록 relation을 join으로 함께 조회한다.
   */
  async getFullPostsByUser(
    userId: string,
    take: number,
    cursorDate: Date | null,
  ): Promise<Post[]> {
    return await this.repository.find({
      where: this.buildUserPostsWhere(userId, cursorDate),
      relations: {
        author: true,
        postMusics: {
          music: true,
        },
      },
      select: {
        id: true,
        coverImgUrl: true,
        content: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
        // User 엔티티에는 email, providerRefreshToken 등이 있으므로 필요한 필드만 선택한다.
        author: {
          id: true,
          nickname: true,
          profileImgUrl: true,
        },
        postMusics: {
          id: true,
          orderIndex: true,
          music: {
            id: true,
            title: true,
            artistName: true,
            albumCoverUrl: true,
            trackUri: true,
            provider: true,
            durationMs: true,
          },
        },
      },
      // relation 컬럼으로 정렬하면 TypeORM이 take 처리용 DISTINCT 서브쿼리에 그 컬럼을 포함시킨다.
      // 그러면 LIMIT이 게시글 수가 아니라 join된 행 수에 걸려 페이지 크기가 어긋난다.
      // 음악 정렬은 조회 후 서비스에서 처리한다.
      order: {
        createdAt: 'DESC',
      },
      take: take,
    });
  }

  private buildUserPostsWhere(
    userId: string,
    cursorDate: Date | null,
  ): FindOptionsWhere<Post> {
    const whereOption: FindOptionsWhere<Post> = {
      author: {
        id: userId,
      },
    };
    if (cursorDate) {
      whereOption.createdAt = LessThan(cursorDate);
    }

    return whereOption;
  }
}
