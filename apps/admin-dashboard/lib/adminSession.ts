import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import type { ServerResponse } from 'http';
import {
  AdminSessionUnauthorizedError,
  buildLoginRedirectDestination,
  clearAdminSessionCookie,
  getAdminSessionToken,
} from './adminSessionShared';

export function appendResponseCookie(res: ServerResponse, cookieValue: string) {
  const current = typeof res.getHeader === 'function' ? res.getHeader('Set-Cookie') : undefined;

  if (!current) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  const values = Array.isArray(current) ? current : [String(current)];
  res.setHeader('Set-Cookie', [...values, cookieValue]);
}

export function getRequestPath(context: GetServerSidePropsContext) {
  const path = context.resolvedUrl || context.req.url || '/';
  return path.startsWith('/') ? path : '/';
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
