import { Post } from 'src/modules/post/entities/post.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Like {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn('uuid', { name: 'post_id' })
  postId: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;
}
