import { expect, test, type Page } from '@playwright/test';

/**
 * `#486` Sidebar 훅 분리 후 드로어 열림/바깥클릭 닫힘/ESC 닫힘 회귀 확인.
 * 백엔드 없이 돌도록 API를 라우트 목으로 대신한다(modal-shell-screens.spec.ts와 같은 방식).
 *
 * 드로어는 opacity/display가 아니라 translate로 여닫혀 toBeVisible()이 무의미하다(마운트 즉시 true).
 * toBeInViewport()로 실제 슬라이드 애니메이션이 끝나 화면 안에 들어왔는지까지 확인한다.
 */
const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const routeAmbient = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  });

  await page.route('**/api/**', (route) => route.fulfill(json({})));
  await page.route('**/api/user/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) }));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [], hasNext: false })));
};

const openDrawer = async (page: Page, title: string) => {
  await page.getByTitle(title).first().click();
  await expect(page.getByRole('heading', { name: title })).toBeInViewport({ timeout: 30_000 });
};

test.describe('Sidebar 드로어', () => {
  test('검색 아이콘을 누르면 드로어가 열린다', async ({ page }) => {
    await routeAmbient(page);
    await page.goto('/');

    await openDrawer(page, '검색');
  });

  test('드로어 바깥을 클릭하면 닫힌다', async ({ page }) => {
    await routeAmbient(page);
    await page.goto('/');

    await openDrawer(page, '검색');

    // 사이드바/드로어 영역 밖(우측 빈 공간)을 클릭
    await page.mouse.click(1200, 400);

    await expect(page.getByRole('heading', { name: '검색' })).not.toBeInViewport({ timeout: 5_000 });
  });

  test('ESC 키를 누르면 드로어가 닫힌다', async ({ page }) => {
    await routeAmbient(page);
    await page.goto('/');

    await openDrawer(page, '검색');

    await page.keyboard.press('Escape');

    await expect(page.getByRole('heading', { name: '검색' })).not.toBeInViewport({ timeout: 5_000 });
  });

  test('드로어를 연 채로 다른 드로어를 누르면 전환된다', async ({ page }) => {
    await routeAmbient(page);
    await page.goto('/');

    await openDrawer(page, '검색');
    await openDrawer(page, '알림');

    await expect(page.getByRole('heading', { name: '검색' })).not.toBeInViewport();
  });
});
