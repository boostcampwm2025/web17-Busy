import { expect, test, type Page } from '@playwright/test';

/**
 * 재현 확인용: 데스크탑 피드에서 사이드바 로그인 버튼으로 모달을 띄웠을 때
 * 게시물 앨범 커버가 모달 위로 올라오는지 본다.
 *
 * 기존 modal-shell-screens.spec.ts는 피드를 빈 배열로 목킹해서 커버가 아예 없었다.
 * 여기서는 커버가 있는 게시물을 여러 개 깔고, 실제 히트테스트(elementFromPoint)로 확인한다.
 */

const OUT = 'e2e/__screens__';

/**
 * 실제 앨범아트처럼 밝고 복잡한 커버. 단색으로 목킹하면 모달이 배경에 묻히는지 눈으로 판단할 수 없다.
 * 픽스처 파일을 두지 않는 이유: e2e/__screens__는 gitignore 대상이라 다른 체크아웃에서 깨진다.
 */
const COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff2d55"/><stop offset="50%" stop-color="#00e5ff"/><stop offset="100%" stop-color="#ffe600"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#g)"/>
  <circle cx="70" cy="70" r="52" fill="#7b2cff" opacity="0.85"/>
  <circle cx="190" cy="110" r="44" fill="#00ff90" opacity="0.85"/>
  <rect x="30" y="150" width="200" height="34" fill="#111" opacity="0.7"/>
  <rect x="30" y="196" width="120" height="26" fill="#fff" opacity="0.85"/>
</svg>`;

const coverResponse = { status: 200, contentType: 'image/svg+xml', body: COVER_SVG };

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

const buildPost = (i: number) => ({
  id: `post-${i}`,
  content: `게시글 내용 ${i}`,
  coverImgUrl: '/cover.png',
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  author: { id: `author-${i}`, nickname: `작성자 ${i}`, profileImgUrl: null },
  musics: [buildMusic(i)],
});

const routeFeedWithCovers = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  });

  // Playwright는 나중에 등록한 핸들러가 우선한다. catch-all을 먼저 깔고 구체적인 것을 뒤에 둔다.
  await page.route('**/api/**', (route) => route.fulfill(json({})));
  await page.route('**/cover.png', (route) => route.fulfill(coverResponse));
  await page.route('**/_next/image**', (route) => route.fulfill(coverResponse));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/privacy', (route) => route.fulfill(json({ items: [{ id: 'c1', agreedAt: '2026-01-01' }] })));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [1, 2, 3, 4].map(buildPost), hasNext: false })));
  await page.route('**/api/user/me', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthenticated' }) }),
  );
};

test('데스크탑 피드에서 사이드바 로그인 모달이 앨범 커버 위에 뜬다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await routeFeedWithCovers(page);
  await page.goto('/');

  // 커버가 실제로 그려진 뒤에 연다 (커버가 없으면 이 버그를 재현할 수 없다)
  await expect(page.getByText('게시글 내용 1').first()).toBeVisible({ timeout: 30_000 });

  await page.getByTitle('로그인').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500); // 열림 애니메이션

  await page.screenshot({ path: `${OUT}/login-modal-over-feed.png`, fullPage: false });

  // 히트테스트: 모달 카드 한가운데를 실제로 잡는 게 모달 안쪽 요소여야 한다
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();

  const hit = await page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x!, y!);
      if (!el) return { tag: 'none', insideDialog: false, cls: '' };
      return {
        tag: el.tagName,
        insideDialog: Boolean(el.closest('[role="dialog"]')),
        cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
      };
    },
    [box!.x + box!.width / 2, box!.y + box!.height / 2],
  );

  expect(hit, `모달 중앙을 잡은 요소: ${JSON.stringify(hit)}`).toMatchObject({ insideDialog: true });

  // 배경(딤) 영역도 확인: 게시물 커버가 있던 자리를 눌러도 모달 레이어가 잡혀야 한다
  const coverHit = await page.evaluate(() => {
    const img = document.querySelector('main img');
    if (!img) return { found: false, insideModalLayer: false, tag: '' };
    const r = img.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      found: true,
      tag: el?.tagName ?? 'none',
      insideModalLayer: Boolean(el?.closest('[role="dialog"]')) || el?.classList.contains('fixed') === true,
    };
  });

  expect(coverHit, `커버 위치를 잡은 요소: ${JSON.stringify(coverHit)}`).toMatchObject({ found: true, insideModalLayer: true });
});
