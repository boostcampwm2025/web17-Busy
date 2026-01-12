import { Post } from 'src/modules/post/entities/post.entity';
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
export class Comment {
  @PrimaryColumn('char', { name: 'comment_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidv7();
  }

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column('varchar', { length: 2300 })
  content: string;

  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
