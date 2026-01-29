import { Controller, Get, Query } from '@nestjs/common';
import { TrendingService } from './trending.service';

@Controller('trending')
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  @Get()
  async top(@Query('limit') limit?: string) {
    return this.trendingService.getTop(limit ? Number(limit) : 10);
  }
}
