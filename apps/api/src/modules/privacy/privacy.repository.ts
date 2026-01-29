import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentHistory, ConsentType } from './privacy.entity';

@Injectable()
export class PrivacyRepository {
  constructor(
    @InjectRepository(ConsentHistory)
    private readonly repository: Repository<ConsentHistory>,
  ) {}

  async createConsent(
    userId: string,
    type: ConsentType,
    agreed: boolean,
    ipAddress?: string,
    version: string = 'v1.0',
  ): Promise<ConsentHistory> {
    const consent = this.repository.create({
      userId,
      type,
      agreed,
      ipAddress,
      version,
    });

    return await this.repository.save(consent);
  }

  async findLatestConsent(
    userId: string,
    type: ConsentType,
  ): Promise<ConsentHistory | null> {
    return await this.repository.findOne({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
  }
}
