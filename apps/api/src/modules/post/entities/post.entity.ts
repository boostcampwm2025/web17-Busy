import { User } from 'src/modules/user/entities/user.entity';
import { Like } from 'src/modules/like/entities/like.entity';
import { PostMusic } from './post-music.entity';

import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class Post {
  @PrimaryColumn('char', { name: 'post_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => PostMusic, (postMusic) => postMusic.post)
  postMusics: PostMusic[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Column('varchar', { name: 'cover_img_url', length: 2083, nullable: false })
  coverImgUrl: string;

  @Column('varchar', { length: 2300, nullable: true })
  content: string;

  @Column('int', { name: 'like_count', nullable: false })
  likeCount: number;

  @Column('int', { name: 'comment_count', nullable: false })
  commentCount: number;

  // 생성: INSERT 시각만
  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  // 수정: UPDATE마다 자동 갱신 필요 (ON UPDATE)
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  // 삭제(soft delete): 기본값 두지 말 것 (NULL이어야 정상)
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  deletedAt: Date | null;
}
