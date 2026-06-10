export type AuthorizationHeaderParseResult = {
  readonly accessToken: string;
};

export function parseBearerAuthorizationHeader(
  authorizationHeader: string | undefined,
): AuthorizationHeaderParseResult {
  if (!authorizationHeader) {
    throw new Error('Authorization header is required.');
  }

  const [scheme, accessToken, extra] = authorizationHeader.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !accessToken || extra) {
    throw new Error('Authorization header must use the Bearer scheme.');
  }

  return { accessToken };
}
