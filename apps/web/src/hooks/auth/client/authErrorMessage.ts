const DEFAULT_MESSAGE = '로그인에 실패했어요. 잠시 후 다시 시도해주세요.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 공통 (OAuth)
  missing_verifier: '로그인 세션이 만료됐어요. 다시 시도해주세요.',
  missing_state_cookie: '로그인 세션이 만료됐어요. 다시 시도해주세요.',
  missing_state_query: '로그인 요청 정보가 누락됐어요. 다시 시도해주세요.',
  state_mismatch: '로그인 세션이 만료됐어요. 다시 시도해주세요.',
  no_authorization_code: '로그인 인증 코드가 누락됐어요. 다시 시도해주세요.',
  token_exchange_failed: '로그인 처리 중 오류가 발생했어요. 다시 시도해주세요.',

  // Provider-specific prefix 패턴 (현재 구현과 호환)
  spotify_error_access_denied: 'Spotify 로그인 권한이 거부되었어요.',
  google_error_access_denied: 'Google 로그인 권한이 거부되었어요.',
};

function normalizeErrorKey(raw?: string) {
  return (raw ?? '').trim();
}

/**
 * authError(code)를 사람이 읽을 수 있는 문장으로 변환
 */
export function getAuthErrorMessage(authError?: string) {
  const key = normalizeErrorKey(authError);
  if (!key) return DEFAULT_MESSAGE;

  // spotify_error_xxx / google_error_xxx 형식 일반 처리
  if (key.startsWith('spotify_error_')) return 'Spotify 로그인에 실패했어요.';
  if (key.startsWith('google_error_')) return 'Google 로그인에 실패했어요.';

  return AUTH_ERROR_MESSAGES[key] ?? DEFAULT_MESSAGE;
}
