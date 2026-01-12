import { User } from 'src/modules/user/entities/user.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { v7 as uuidv7 } from 'uuid';

@Entity()
export class Post {
  @PrimaryColumn('char', { name: 'post_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidv7();
  }

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column('varchar', { name: 'cover_img_url', length: 2083 })
  coverImgUrl: string;

  @Column('varchar', { length: 2300 })
  content: string;

  @Column('int', { name: 'like_count' })
  likeCount: number;

  @Column('int', { name: 'comment_count' })
  commentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
