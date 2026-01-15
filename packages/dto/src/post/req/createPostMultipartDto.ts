export class CreatePostMultipartDto {
  content: string;

  // musics: MusicRequest[] 를 "문자열"로 받는다 (JSON string)
  musics: string;

  // thumbnailImgUrl은 이제 서버가 파일 저장 후 만들어 넣을거라 굳이 안 받아도 됨
  // (원하면 유지해도 되지만, 우선은 제거 추천)
}
