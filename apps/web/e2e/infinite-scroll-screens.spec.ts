import { expect, test, type Page } from '@playwright/test';

/**
 * #344에서 무한 스크롤 훅 3층을 하나로 합친 뒤, 단위 테스트로만 확인했던 화면 3곳을
 * 실제 브라우저에서 검증한다. 피드와 프로필 게시글은 이미 측정 하네스로 확인했다.
 *
 * - 프로필 격자
 * - 유저 검색
 * - 팔로워·팔로잉 모달 (파생 상태 제거로 고친 팔로우 되돌림 버그 포함)
 *
 * 백엔드 없이 돌도록 모든 API를 라우트 목으로 대신한다.
 */

// next dev가 라우트를 컴파일하는 동안 병렬 워커가 겹치면 요청이 끊긴다.
// serial이 아니라 default라야 한 화면이 깨져도 나머지 화면의 결과를 볼 수 있다.
test.describe.configure({ mode: 'default' });

const PAGE_SIZE = 12;
const TOTAL_PAGES = 3;
const VIEWER_ID = 'viewer-1';
const PROFILE_ID = 'profile-owner';

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

/** 응답이 즉시 돌아오면 in-flight 가드가 막아야 할 창 자체가 생기지 않는다. */
const MOCK_API_DELAY_MS = 120;

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const delayed = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_API_DELAY_MS);
  });
};

/** 커서는 `page-N` 형태로 주고받는다. 커서가 없으면 첫 페이지다. */
const pageIndexOf = (url: string) => {
  const cursor = new URL(url).searchParams.get('cursor');
  const parsed = Number.parseInt((cursor ?? '').replace('page-', ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pagedBody = <T>(pageIndex: number, key: 'posts' | 'users', items: T[]) => {
  const hasNext = pageIndex + 1 < TOTAL_PAGES;
  return { [key]: items, hasNext, nextCursor: hasNext ? `page-${pageIndex + 1}` : undefined };
};

const buildUser = (pageIndex: number, index: number) => ({
  id: `user-${pageIndex}-${index}`,
  nickname: `유저 ${pageIndex}-${index}`,
  profileImgUrl: null,
  isFollowing: false,
});

const buildPreviewPost = (pageIndex: number, index: number) => ({
  postId: `post-${pageIndex}-${index}`,
  coverImgUrl: '/cover.png',
  likeCount: index,
  commentCount: index,
  isMoreThanOneMusic: false,
});

const buildProfile = (userId: string) => ({
  id: userId,
  nickname: `프로필 ${userId}`,
  profileImgUrl: null,
  bio: '검증용 프로필',
  followerCount: PAGE_SIZE * TOTAL_PAGES,
  followingCount: PAGE_SIZE * TOTAL_PAGES,
  isFollowing: false,
});

/**
 * Playwright는 나중에 등록한 핸들러를 먼저 검사한다.
 * 남은 API가 백엔드로 프록시돼 5초씩 대기하지 않도록 폴백을 가장 먼저 깔아둔다.
 */
const routeAmbientApis = async (page: Page, viewer: { id: string } | null) => {
  await page.addInitScript(() => {
    // PWA 설치 배너가 화면 위를 덮지 않도록 미리 닫아둔다.
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  });

  await page.route('**/api/**', (route) => route.fulfill(json({})));
  await page.route('**/_next/image**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/cover.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [], hasNext: false })));

  await page.route('**/api/user/me', (route) => {
    if (!viewer) {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthenticated' }) });
      return;
    }
    route.fulfill(json({ id: viewer.id, nickname: '나', profileImgUrl: null }));
  });
};

/** `/api/user/search`와 `/api/user/:id`가 같은 prefix라 순서에 의존하지 않도록 한 핸들러에서 갈라낸다. */
const routeUserApis = async (page: Page, onSearch?: (url: string) => void) => {
  await page.route('**/api/user/**', async (route) => {
    const url = route.request().url();
    const { pathname } = new URL(url);

    if (pathname.endsWith('/api/user/search')) {
      onSearch?.(url);
      const pageIndex = pageIndexOf(url);
      await delayed();
      await route.fulfill(
        json(
          pagedBody(
            pageIndex,
            'users',
            Array.from({ length: PAGE_SIZE }, (_, i) => buildUser(pageIndex, i)),
          ),
        ),
      );
      return;
    }

    if (pathname.endsWith('/api/user/me')) {
      route.fallback();
      return;
    }

    route.fulfill(json(buildProfile(pathname.split('/api/user/')[1] ?? '')));
  });
};

/**
 * 스크롤 컨테이너가 화면마다 달라(main / 드로어 / 모달) 마지막 항목을 뷰로 끌어온다.
 * 센티넬의 rootMargin이 200px이라 마지막 항목이 보이면 다음 페이지 요청이 걸린다.
 */
const scrollUntil = async (lastItem: () => Promise<void>, expected: () => Promise<number>, target: number, message: string) => {
  await expect
    .poll(
      async () => {
        await lastItem();
        return expected();
      },
      { timeout: 30_000, message },
    )
    .toBe(target);
};

test.describe('무한 스크롤 소비 화면', () => {
  test('프로필 격자가 스크롤에 따라 페이지를 이어 붙인다', async ({ page }) => {
    const requestedCursors: (string | null)[] = [];

    await routeAmbientApis(page, null);
    await routeUserApis(page);
    await page.route('**/api/post/user/**', async (route) => {
      const url = route.request().url();
      requestedCursors.push(new URL(url).searchParams.get('cursor'));

      const pageIndex = pageIndexOf(url);
      await delayed();
      await route.fulfill(
        json(
          pagedBody(
            pageIndex,
            'posts',
            Array.from({ length: PAGE_SIZE }, (_, i) => buildPreviewPost(pageIndex, i)),
          ),
        ),
      );
    });

    await page.goto(`/profile/${PROFILE_ID}`);

    const cards = page.locator('img[alt^="사용자 게시물:"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    await expect(cards).toHaveCount(PAGE_SIZE);

    await scrollUntil(
      () => cards.last().scrollIntoViewIfNeeded(),
      () => cards.count(),
      PAGE_SIZE * TOTAL_PAGES,
      '프로필 격자가 모든 페이지를 이어 붙이지 못했다',
    );

    // 같은 커서를 두 번 요청하면 중복 요청 가드가 깨진 것이다.
    expect(requestedCursors).toEqual([null, 'page-1', 'page-2']);
  });

  test('유저 검색이 디바운스 후 요청하고 다음 페이지를 이어 받는다', async ({ page }) => {
    const searchUrls: string[] = [];

    await routeAmbientApis(page, { id: VIEWER_ID });
    await routeUserApis(page, (url) => searchUrls.push(url));

    await page.goto('/');
    await page.getByTitle('검색').first().click();

    const input = page.getByPlaceholder('음악 검색, 사용자 검색');
    await expect(input).toBeVisible({ timeout: 30_000 });

    await page.getByTitle('사용자 검색 탭').click();
    // 한 글자씩 입력해도 디바운스가 중간 입력을 흘려보내야 한다.
    await input.pressSequentially('유저', { delay: 40 });

    const rows = page.getByText(/^유저 \d-\d+$/);
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });

    // 디바운스가 살아 있으면 첫 페이지 요청은 입력 횟수와 무관하게 한 번이다.
    expect(searchUrls.filter((url) => new URL(url).searchParams.get('cursor') === null)).toHaveLength(1);

    await scrollUntil(
      () => rows.last().scrollIntoViewIfNeeded(),
      () => rows.count(),
      PAGE_SIZE * TOTAL_PAGES,
      '유저 검색이 다음 페이지를 받지 못했다',
    );
  });

  /**
   * 검색 결과의 팔로우 상태는 로컬 override가 아니라 query cache에서 내려온다.
   * 따라서 버튼이 뒤집히는 것 자체가 mutation의 cache patch가 검색 캐시까지 닿았다는 증거다.
   */
  test('검색 결과에서 팔로우하면 mutation이 검색 캐시를 갱신해 버튼이 바뀐다', async ({ page }) => {
    const followedIds: string[] = [];

    await routeAmbientApis(page, { id: VIEWER_ID });
    await routeUserApis(page);

    await page.route('**/api/follow', async (route) => {
      const body = route.request().postDataJSON() as { otherUserId?: string } | null;
      if (route.request().method() === 'POST' && body?.otherUserId) followedIds.push(body.otherUserId);
      await delayed();
      await route.fulfill(json({ success: true }));
    });

    await page.goto('/');
    await page.getByTitle('검색').first().click();

    const input = page.getByPlaceholder('음악 검색, 사용자 검색');
    await expect(input).toBeVisible({ timeout: 30_000 });

    await page.getByTitle('사용자 검색 탭').click();
    await input.pressSequentially('유저', { delay: 40 });

    const firstRow = page
      .locator('div')
      .filter({ hasText: /^유저 0-0팔로우$/ })
      .last();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });

    await firstRow.getByRole('button', { name: '팔로우', exact: true }).click();

    await expect(page.getByRole('button', { name: '팔로우 중' })).toBeVisible({ timeout: 10_000 });
    expect(followedIds).toEqual(['user-0-0']);
  });

  test('팔로워 모달에서 팔로우한 상태가 다음 페이지 로드 후에도 유지된다', async ({ page }) => {
    const followedIds: string[] = [];

    await routeAmbientApis(page, { id: VIEWER_ID });
    await routeUserApis(page);
    await page.route('**/api/post/user/**', (route) => route.fulfill(json({ posts: [], hasNext: false })));

    await page.route('**/api/follow/follower/**', async (route) => {
      const pageIndex = pageIndexOf(route.request().url());
      await delayed();
      await route.fulfill(
        json(
          pagedBody(
            pageIndex,
            'users',
            Array.from({ length: PAGE_SIZE }, (_, i) => buildUser(pageIndex, i)),
          ),
        ),
      );
    });

    await page.route('**/api/follow', (route) => {
      const body = route.request().postDataJSON() as { otherUserId?: string } | null;
      if (route.request().method() === 'POST' && body?.otherUserId) followedIds.push(body.otherUserId);
      route.fulfill(json({ success: true }));
    });

    await page.goto(`/profile/${PROFILE_ID}`);
    await page.getByTitle('팔로워 목록').click();

    const rows = page.locator('li').filter({ hasText: /^유저 \d-\d+/ });
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    await expect(rows).toHaveCount(PAGE_SIZE);

    // 첫 페이지의 사용자를 팔로우한다.
    await firstRow.getByTitle('팔로우').click();
    await expect(firstRow.getByTitle('팔로우 취소')).toBeVisible({ timeout: 10_000 });
    expect(followedIds).toEqual(['user-0-0']);

    // 다음 페이지를 붙인다. 예전 구조에서는 여기서 로컬 복사본이 덮어써져 팔로우가 되돌아갔다.
    await scrollUntil(
      () => rows.last().scrollIntoViewIfNeeded(),
      () => rows.count(),
      PAGE_SIZE * TOTAL_PAGES,
      '팔로워 모달이 다음 페이지를 받지 못했다',
    );

    // 새 페이지가 붙은 뒤에도 팔로우 상태가 그대로여야 한다.
    await expect(firstRow.getByTitle('팔로우 취소')).toBeVisible();
    expect(followedIds).toEqual(['user-0-0']);
  });
});
