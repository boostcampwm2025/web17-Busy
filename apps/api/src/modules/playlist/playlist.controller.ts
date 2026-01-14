import { Controller } from '@nestjs/common';
import { PlaylistService } from './index';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}
}
