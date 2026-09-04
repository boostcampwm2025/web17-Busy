import http from 'node:http';

/**
 * log-terminate-keepalive-measurement.spec.ts 전용 리버스 프록시. playwright.config.ts의
 * webServer가 3010을 선점하지 않도록 Playwright 밖에서 미리 떠 있어야 한다(reuseExistingServer가
 * "이미 뜬 서버"로 인식해야 next dev가 따로 안 뜬다).
 *
 * `/api/logs`는 여기서 직접 캡처하고 `/__test__/arrivals`로 도착 수를 폴링한다. 그 외 API는
 * canned 응답, 나머지는 실제 프로덕션 서버(3011)로 넘긴다.
 *
 * 실행: node e2e/support/log-terminate-proxy-server.mjs
 */

const PROXY_PORT = 3010;
const NEXT_PORT = 3011;

const VIEWER_ID = 'viewer-1';
const POST_ID = 'post-1';

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const post = {
  id: POST_ID,
  content: '게시글 내용',
  coverImgUrl: '/cover.png',
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  author: { id: VIEWER_ID, nickname: '나', profileImgUrl: null },
  musics: [],
};

const jsonResponse = (body) => ({ status: 200, contentType: 'application/json', body: Buffer.from(JSON.stringify(body)) });
const pngResponse = { status: 200, contentType: 'image/png', body: TRANSPARENT_PNG };

const mocked = (url) => {
  if (url.startsWith('/_next/image')) return pngResponse;
  if (url === '/cover.png') return pngResponse;
  if (url.startsWith('/api/user/me')) return jsonResponse({ id: VIEWER_ID, nickname: '나', profileImgUrl: null });
  if (url.startsWith('/api/noti')) return jsonResponse([]);
  if (url.startsWith('/api/privacy')) return jsonResponse({ items: [{ id: 'c1', agreedAt: '2026-01-01' }] });
  if (url.startsWith('/api/comment')) return jsonResponse({ comments: [], hasNext: false });
  if (url.startsWith('/api/feed')) return jsonResponse({ posts: [post], hasNext: false });
  if (url.startsWith(`/api/post/${POST_ID}`)) return jsonResponse(post);
  return null;
};

let arrivalCount = 0;

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';

  if (req.method === 'GET' && url === '/__test__/arrivals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: arrivalCount }));
    return;
  }

  if (req.method === 'POST' && url.startsWith('/api/logs')) {
    req.on('data', () => {});
    req.on('end', () => {
      arrivalCount += 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  const canned = mocked(url);
  if (canned) {
    res.writeHead(canned.status, { 'Content-Type': canned.contentType, 'Cache-Control': 'no-store' });
    res.end(canned.body);
    return;
  }

  const proxyReq = http.request(
    { hostname: '127.0.0.1', port: NEXT_PORT, path: url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', () => {
    res.writeHead(502);
    res.end();
  });
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`[log-terminate-proxy] listening on ${PROXY_PORT}, forwarding to ${NEXT_PORT}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
