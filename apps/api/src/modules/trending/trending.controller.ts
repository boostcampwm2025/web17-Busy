import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TrendingService } from './trending.service';
import type { TrendingInteractionType } from './trending.constants';

@Controller('trending')
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  @Post(':postId/:type')
  async hit(
    @Param('postId') postId: string,
    @Param('type') type: TrendingInteractionType,
  ) {
    await this.trendingService.addInteraction(postId, type);
    return { ok: true };
  }

  @Get()
  async top(@Query('limit') limit?: string) {
    return this.trendingService.getTop(limit ? Number(limit) : 10);
  }
}
