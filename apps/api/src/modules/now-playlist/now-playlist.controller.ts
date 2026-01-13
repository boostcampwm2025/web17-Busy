import { Controller } from '@nestjs/common';
import { NowPlaylistService } from './now-playlist.service';

@Controller('nowPlaylist')
export class NowPlaylistController {
  constructor(private readonly nowPlaylistService: NowPlaylistService) {}
}
