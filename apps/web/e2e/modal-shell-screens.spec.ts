import { expect, test, type Page } from '@playwright/test';

/**
 * `#315` ModalShell 도입 후 모달 7개의 시각적 회귀를 실제 브라우저에서 확인한다.
 * 백엔드 없이 돌도록 모든 API를 라우트 목으로 대신한다(infinite-scroll-screens.spec.ts와 같은 방식).
 */
test.describe.configure({ mode: 'default' });

const VIEWER_ID = 'viewer-1';
const PROFILE_ID = 'profile-owner';
const OUT = 'e2e/__screens__';

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const buildMusic = (i: number) => ({
  id: `music-${i}`,
  title: `노래 ${i}`,
  artistName: `아티스트 ${i}`,
  albumCoverUrl: '/cover.png',
  trackUri: `spotify:track:${i}`,
  provider: 'youtube',
  durationMs: 180000,
});

/** `consents`가 비어 있으면 PrivacyConsentGate가 약관 모달을 자동으로 띄운다. */
const routeAmbient = async (page: Page, opts: { viewer: boolean; emptyConsents?: boolean }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  });

  await page.route('**/api/**', (route) => route.fulfill(json({})));
  await page.route('**/_next/image**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/cover.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [], hasNext: false })));
  await page.route('**/api/privacy', (route) => route.fulfill(json({ items: opts.emptyConsents ? [] : [{ id: 'c1', agreedAt: '2026-01-01' }] })));

  await page.route('**/api/user/me', (route) => {
    if (!opts.viewer) {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthenticated' }) });
      return;
    }
    route.fulfill(json({ id: VIEWER_ID, nickname: '나', profileImgUrl: null }));
  });
};

const shot = async (page: Page, name: string) => {
  await page.waitForTimeout(400); // 열림 애니메이션(0.2s)이 끝난 뒤를 찍는다
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
};

test.describe('ModalShell 시각 확인', () => {
  test('LoginModal', async ({ page }) => {
    await routeAmbient(page, { viewer: false });
    await page.goto('/');
    await page.getByTitle('로그인').first().click();
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '1-login');
  });

  test('ContentWriteModal', async ({ page }) => {
    await routeAmbient(page, { viewer: true });
    await page.goto('/');
    await page.getByTitle('추천').first().click();
    await expect(page.getByRole('heading', { name: '새 게시물 만들기' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '2-content-write');
  });

  test('PrivacyConsentModal', async ({ page }) => {
    await routeAmbient(page, { viewer: true, emptyConsents: true });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '약관 동의' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '3-privacy-consent');
  });

  test('UserListModal', async ({ page }) => {
    await routeAmbient(page, { viewer: true });
    await page.route('**/api/user/**', (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname.endsWith('/api/user/me')) return route.fallback();
      return route.fulfill(
        json({ id: PROFILE_ID, nickname: '프로필', profileImgUrl: null, bio: '', followerCount: 3, followingCount: 3, isFollowing: false }),
      );
    });
    await page.route('**/api/post/user/**', (route) => route.fulfill(json({ posts: [], hasNext: false })));
    await page.route('**/api/follow/follower/**', (route) =>
      route.fulfill(
        json({
          users: Array.from({ length: 3 }, (_, i) => ({ id: `u${i}`, nickname: `유저 ${i}`, profileImgUrl: null, isFollowing: false })),
          hasNext: false,
        }),
      ),
    );

    await page.goto(`/profile/${PROFILE_ID}`);
    await page.getByTitle('팔로워 목록').click();
    await expect(page.getByRole('heading', { name: '팔로워 목록' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '4-user-list');
  });

  test('PlaylistDetailModal', async ({ page }) => {
    await routeAmbient(page, { viewer: true });
    await page.route('**/api/playlist', (route) =>
      route.fulfill(json({ playlists: [{ id: 'pl-1', title: '내 플레이리스트', tracksCount: 2, firstAlbumCoverUrl: '/cover.png' }] })),
    );
    await page.route('**/api/playlist/pl-1', (route) =>
      route.fulfill(json({ id: 'pl-1', title: '내 플레이리스트', musics: [buildMusic(1), buildMusic(2)] })),
    );

    await page.goto('/archive');
    await page.getByRole('main').getByText('내 플레이리스트').first().click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '내 플레이리스트' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '5-playlist-detail');
  });

  test('PostDetailDesktopModal', async ({ page }) => {
    await routeAmbient(page, { viewer: true });
    const post = {
      id: 'post-1',
      content: '게시글 내용',
      coverImgUrl: '/cover.png',
      likeCount: 3,
      commentCount: 0,
      isLiked: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      author: { id: VIEWER_ID, nickname: '나', profileImgUrl: null },
      musics: [buildMusic(1)],
    };
    await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [post], hasNext: false })));
    await page.route('**/api/post/post-1', (route) => route.fulfill(json(post)));
    await page.route('**/api/comment**', (route) => route.fulfill(json({ comments: [], hasNext: false })));

    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByText('게시글 내용').first().click({ timeout: 30_000 });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
    await shot(page, '6-post-detail');

    // 배경 클릭으로 닫히고, 카드 안 클릭으로는 안 닫혀야 한다(ModalShell 전환 회귀 확인).
    await page.getByRole('dialog').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

    expect(pageErrors).toEqual([]);
  });

  test('LikedUsersOverlay (PostCardDetailModal 위)', async ({ page }) => {
    await routeAmbient(page, { viewer: true });
    const post = {
      id: 'post-1',
      content: '게시글 내용',
      coverImgUrl: '/cover.png',
      likeCount: 3,
      commentCount: 0,
      isLiked: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      author: { id: VIEWER_ID, nickname: '나', profileImgUrl: null },
      musics: [buildMusic(1)],
    };
    await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [post], hasNext: false })));
    await page.route('**/api/post/post-1', (route) => route.fulfill(json(post)));
    await page.route('**/api/like/post-1/users**', (route) =>
      route.fulfill(json(Array.from({ length: 3 }, (_, i) => ({ id: `u${i}`, nickname: `좋아요 유저 ${i}`, profileImgUrl: null })))),
    );
    await page.route('**/api/comment**', (route) => route.fulfill(json({ comments: [], hasNext: false })));

    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByText('게시글 내용').first().click({ timeout: 30_000 });
    await page.getByTitle('좋아요한 사용자 보기').click({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: '좋아요' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '7-liked-users');
    expect(pageErrors).toEqual([]);
  });

  test('모바일: 모달이 하단 네비 위로 올라온다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await routeAmbient(page, { viewer: false });
    await page.goto('/');

    // 사이드바는 lg 전용이다. 모바일에서는 미로그인 상태로 하단 네비의 '프로필'을 누르면 로그인 모달이 뜬다.
    const profileTab = page.getByText('프로필', { exact: true }).last();
    await expect(profileTab).toBeVisible({ timeout: 30_000 });
    await profileTab.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
    await shot(page, '8-mobile-login-over-bottomnav');
  });
});
