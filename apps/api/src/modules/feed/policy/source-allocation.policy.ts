import { Injectable } from '@nestjs/common';

@Injectable()
export class SourceAllocationPolicy {
  allocate(limit: number) {
    const eachLimit = Math.ceil(limit / 3);

    return {
      followingLimit: eachLimit,
      trendingLimit: eachLimit,
      recentLimit: eachLimit,
    };
  }
}
