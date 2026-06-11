export const VANPICK_WEB_URL = 'https://vanpick.app';

export const INTERNAL_WEBVIEW_HOSTS = new Set(['vanpick.app', 'www.vanpick.app']);

export const WEBVIEW_FLOW_HOSTS = new Set([
  'accounts.kakao.com',
  'appleid.apple.com',
  'kauth.kakao.com',
  'kapi.kakao.com',
  'pay.toss.im',
  'payment-widget.tosspayments.com',
  'api.tosspayments.com',
]);

export const OAUTH_BROWSER_HOSTS = new Set(['appleid.apple.com']);

export const SUPABASE_OAUTH_PATH_SEGMENTS = ['/auth/v1/authorize', '/auth/v1/callback'];

export const VANPICK_AUTH_CALLBACK_PATH = '/auth/callback';

export const VANPICK_AUTH_CALLBACK_URL = `${VANPICK_WEB_URL}${VANPICK_AUTH_CALLBACK_PATH}`;

export const EXTERNAL_APP_SCHEMES = new Set([
  'intent',
  'kakaokompassauth',
  'kakaolink',
  'kakaoplus',
  'kakaotalk',
]);

export const APP_SCHEME = 'vanpick';
