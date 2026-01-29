import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TrendingService } from './trending.service';
import type { TrendingInteractionType } from './trending.constants';

@Controller('trending')
export class TrendingController {}
