export class YoutubeMusicDto {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      high: { url: string };
    };
  };
  contentDetails?: {
    duration: string;
  };
}
