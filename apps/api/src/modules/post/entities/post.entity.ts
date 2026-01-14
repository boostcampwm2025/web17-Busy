import { User } from 'src/modules/user/entities/user.entity';
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

  @Column('varchar', { name: 'cover_img_url', length: 2083, nullable: false })
  thumbnailImgUrl: string;

  @Column('varchar', { length: 2300, nullable: true })
  content: string;

  @Column('int', { name: 'like_count', nullable: false })
  likeCount: number;

  @Column('int', { name: 'comment_count', nullable: false })
  commentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
