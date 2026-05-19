# 리팩토링 후보 목록

코드 분석을 통해 발견한 개선 포인트. 우선순위 순으로 정렬.

---

## 1. 버그 — `Promise.all` 내부 이중 `await`

**파일:** `apps/api/src/modules/feed/feed.service.ts` L37–44

`await`가 `Promise.all` 인자 안과 밖에 중복으로 붙어 있어, 두 소스 조회가 실질적으로 순차 실행된다.

```ts
// 현재 (순차 실행)
await Promise.all([
  await this.followingSource.getPosts(...),
  await this.trendingSource.getPosts(...),
]);

// 수정 (병렬 실행)
await Promise.all([
  this.followingSource.getPosts(...),
  this.trendingSource.getPosts(...),
]);
```

---

## 2. Post → DTO 매핑 로직 중복

**파일:**

- `apps/api/src/modules/feed/feed.service.ts` — `mapToFeedResponseDto()`
- `apps/api/src/modules/post/post.service.ts` — `toGetPostDetailResponseDto()`

두 메서드 모두 `Post` 엔티티를 `PostResponseDto`로 변환하지만 각자 구현되어 있다.
`isEdited` 판별식 `updatedAt.getTime() - createdAt.getTime() >= 1000`도 두 곳에 중복.

**개선 방향:** `packages/dto` 또는 공통 유틸에 `toPostResponseDto(post, isLiked)` 하나로 통일.

---

## 3. Music → DTO 필드 나열 중복

**파일:**

- `apps/api/src/modules/feed/feed.service.ts` L78–85
- `apps/api/src/modules/playlist/playlist.service.ts` L77–81
- `apps/api/src/modules/music/music.controller.ts` L16–21
- `apps/api/src/modules/music/music.service.ts` L38–43

`{ id, title, artistName, albumCoverUrl, trackUri, provider, durationMs }` 필드를 4곳에서 각자 수동 나열한다.
Music 엔티티에 필드가 추가될 때마다 4곳을 모두 수정해야 한다.

**개선 방향:** `MusicService`에 `toMusicResponseDto(music: MusicEntity): MusicResponseDto` 추가 후 공유.

---

## 4. 스트림 로그 인터셉터 3개 보일러플레이트 중복

**파일:**

- `apps/api/src/common/interceptors/like-stream-log.interceptor.ts`
- `apps/api/src/common/interceptors/comment-stream-log.interceptor.ts`
- `apps/api/src/common/interceptors/follow-stream-log.interceptor.ts`

세 인터셉터가 동일한 골격(HTTP 컨텍스트 추출 → 성공 응답 확인 → userId/sessionId 추출 → `logsService.ingest`)을 반복한다.
차이는 `eventType`과 `targetPostId` 추출 방식뿐이다.

**개선 방향:** 추상 베이스 클래스를 만들고 `buildEvent(req, res): LogEventDto | null`만 각 구현체에서 오버라이드.
새 이벤트 타입 추가 시 파일을 새로 만들지 않고 구현체만 작성하면 된다.

```ts
// 예시
abstract class BaseStreamLogInterceptor implements NestInterceptor {
  constructor(protected readonly logsService: LogsService) {}

  abstract buildEvent(req: Request, res: Response, durationMs: number): LogEventDto | null;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 공통 골격
  }
}
```

---

## 5. `FeedCompositionPolicy.shuffle` `any` 타입

**파일:** `apps/api/src/modules/feed/policy/feed-composition.policy.ts` L22

```ts
// 현재
shuffle(array: any[])

// 수정
shuffle<T>(array: T[]): T[]
```

`Post[]`만 들어오는데 `any`로 선언돼 있어 타입 안전성이 없다. 제네릭 한 줄로 해결된다.

---

## 6. `FollowingSource` 내 쿼리 빌더 중복

**파일:** `apps/api/src/modules/feed/sources/following.source.ts` L43–89

`getMyPosts`와 `getPostsOfFollowings`의 `createQueryBuilder` 블록이 `leftJoinAndSelect` 3개 + 좋아요 조인까지 동일하다.
차이는 `WHERE` 조건 하나뿐이다.

**개선 방향:** 공통 베이스 쿼리를 private 메서드로 뽑고 각자 조건만 추가.

```ts
private basePostQuery(userId: string) {
  return this.postRepository
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.postMusics', 'postMusic')
    .leftJoinAndSelect('postMusic.music', 'music')
    .leftJoinAndSelect('post.likes', 'like', 'like.userId = :userId', { userId })
    .orderBy('post.id', 'DESC');
}
```

---

## 우선순위 요약

| 순위 | 항목                        | 분류        | 난이도 |
| ---- | --------------------------- | ----------- | ------ |
| 1    | `Promise.all` 이중 await    | 버그        | 낮음   |
| 2    | Post/Music DTO 매핑 중복    | 유지보수    | 중간   |
| 3    | 인터셉터 3개 중복           | 구조 개선   | 중간   |
| 4    | `shuffle` any 타입          | 타입 안전성 | 낮음   |
| 5    | `FollowingSource` 쿼리 중복 | 유지보수    | 낮음   |
