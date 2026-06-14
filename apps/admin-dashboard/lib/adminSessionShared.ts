export const ADMIN_SESSION_COOKIE_NAME = 'admin_access_token';

export class AdminSessionUnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AdminSessionUnauthorizedError';
  }
}

export function parseCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split('=');

    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
}

export function getAdminSessionToken(cookieHeader?: string) {
  return parseCookieHeader(cookieHeader)[ADMIN_SESSION_COOKIE_NAME];
}

export function createAdminSessionCookie(token: string) {
  return [
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearAdminSessionCookie() {
  return [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    process.env.NODE_ENV === 'production' ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export function normalizeNextPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;

  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }

  return path;
}

export function buildLoginRedirectDestination(path: string) {
  return `/login?next=${encodeURIComponent(normalizeNextPath(path))}`;
}

