interface PlaylistBriefResDto {
  id: string;
  title: string;
  tracksCount: number;
  firstAlbumCoverUrl: string;
}

export class GetAllPlaylistsResDto {
  playlists: PlaylistBriefResDto[];
}
