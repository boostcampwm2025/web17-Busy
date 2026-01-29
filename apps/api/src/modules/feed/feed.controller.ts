import {
  Controller,
  DefaultValuePipe,
  Get,
  InternalServerErrorException,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { AuthOptionalGuard } from 'src/common/guards/auth.optional-guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { FeedResponseDto } from '@repo/dto';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(AuthOptionalGuard)
  async feed(
    @UserId() requestUserId: string | null,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new ParseUUIDPipe({ version: '7', optional: true }))
    cursor?: string,
  ): Promise<FeedResponseDto> {
    // try {
    return await this.feedService.feed(requestUserId, limit, cursor);
    // } catch (error) {
    //   throw new InternalServerErrorException(
    //     `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
    //   );
    // }
  }
}
