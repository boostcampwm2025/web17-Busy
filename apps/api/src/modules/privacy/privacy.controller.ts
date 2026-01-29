import { Controller, Post, Body, UseGuards, Ip, Get } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { GetRecentConsentListDto, UpdateConsentListDto } from '@repo/dto';

@Controller('privacy')
@UseGuards(AuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('consent')
  async createConsent(@UserId() userId: string, @Ip() ip: string) {
    await this.privacyService.recordSignupConsents(userId, ip);
    return { success: true };
  }

  @Post()
  async updateConsent(
    @UserId() userId: string,
    @Ip() ip: string,
    @Body() dto: UpdateConsentListDto,
  ) {
    await this.privacyService.updateConsents(userId, dto.items, ip);

    return {
      success: true,
    };
  }

  @Get()
  async getRecentConsents(
    @UserId() userId: string,
  ): Promise<GetRecentConsentListDto> {
    return await this.privacyService.getRecentConsents(userId);
  }
}
