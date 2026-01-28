import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/entities/user.entity';

export enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS',
  PRIVACY_POLICY = 'PRIVACY',
}

@Entity('consent_history')
export class ConsentHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ConsentType })
  type: ConsentType;

  // 동의 여부 (철회 시 false로 새 기록 추가)
  @Column()
  agreed: boolean;

  // 약관 버전
  @Column({ length: 10, default: 'v1.0' })
  version: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
