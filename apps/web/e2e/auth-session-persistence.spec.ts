import { expect, test, type Page } from '@playwright/test';

const APP_JWT = 'e2e-app-jwt-token';
const VIEWER = { id: 'e2e-user-1', nickname: '나', profileImgUrl: null };

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

/** Playwright는 나중에 등록한 핸들러를 먼저 검사하므로 폴백을 가장 먼저 깔아둔다. */
const routeApis = async (page: Page, onAuthMe: (authorization: string | undefined) => void) => {
  await page.addInitScript(() => {
    // PWA 설치 배너가 사이드바를 덮지 않도록 미리 닫아둔다.
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  });

  await page.route('**/api/**', (route) => route.fulfill(json({})));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [], hasNext: false })));

  // 토큰을 실제로 붙여 보낸 요청만 인증된 것으로 취급한다.
  await page.route('**/api/user/me', (route) => {
    const authorization = route.request().headers()['authorization'];
    onAuthMe(authorization);

    if (authorization !== `Bearer ${APP_JWT}`) {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthenticated' }) });
      return;
    }
    route.fulfill(json(VIEWER));
  });
};

const loggedOutButton = (page: Page) => page.getByTitle('로그인');
const loggedInButton = (page: Page) => page.getByTitle('로그아웃');

test.describe('auth session persistence', () => {
  /**
   * #319: 새로고침 후에도 인증 상태가 유지되는지 확인한다.
   * 토큰은 addInitScript가 아니라 첫 진입 후에 심는다.
   * addInitScript로 심으면 reload마다 다시 주입돼 sessionStorage가 살아남았는지를 검증하지 못한다.
   */
  test('keeps the authenticated state across reloads', async ({ page }) => {
    const authorizations: (string | undefined)[] = [];
    await routeApis(page, (authorization) => authorizations.push(authorization));

    await page.goto('/');
    await expect(loggedOutButton(page)).toBeVisible();

    // 로그인 콜백이 하는 일과 같다.
    await page.evaluate((token) => sessionStorage.setItem('appJwt', token), APP_JWT);
    await page.reload();
    await expect(loggedInButton(page)).toBeVisible();

    // 여기가 핵심: 한 번 더 새로고침해도 로그인 상태가 유지돼야 한다.
    await page.reload();
    await expect(loggedInButton(page)).toBeVisible();

    const authorized = authorizations.filter((authorization) => authorization === `Bearer ${APP_JWT}`);
    expect(authorized.length).toBeGreaterThanOrEqual(2);
  });

  test('stays logged out when no token is stored', async ({ page }) => {
    await routeApis(page, () => {});

    await page.goto('/');
    await expect(loggedOutButton(page)).toBeVisible();

    await page.reload();
    await expect(loggedOutButton(page)).toBeVisible();
  });
});
