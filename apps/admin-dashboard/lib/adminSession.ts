import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import type { ServerResponse } from 'http';

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

export function appendResponseCookie(res: ServerResponse, cookieValue: string) {
  const current = typeof res.getHeader === 'function' ? res.getHeader('Set-Cookie') : undefined;

  if (!current) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  const values = Array.isArray(current) ? current : [String(current)];
  res.setHeader('Set-Cookie', [...values, cookieValue]);
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

export function getRequestPath(context: GetServerSidePropsContext) {
  return normalizeNextPath(context.resolvedUrl || context.req.url || '/');
}

export function redirectToLogin(context: GetServerSidePropsContext) {
  return {
    redirect: {
      destination: buildLoginRedirectDestination(getRequestPath(context)),
      permanent: false,
    },
  };
}

export async function withAdminPageAuth<T>(
  context: GetServerSidePropsContext,
  // eslint-disable-next-line no-unused-vars
  loader: (token: string) => Promise<GetServerSidePropsResult<T>>,
): Promise<GetServerSidePropsResult<T>> {
  const token = getAdminSessionToken(context.req?.headers?.cookie);

  if (!token) {
    return redirectToLogin(context);
  }

  try {
    return await loader(token);
  } catch (error) {
    if (error instanceof AdminSessionUnauthorizedError) {
      appendResponseCookie(context.res, clearAdminSessionCookie());
      return redirectToLogin(context);
    }

    throw error;
  }
}
