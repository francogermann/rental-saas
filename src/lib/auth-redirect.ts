export function sanitizeAuthRedirect(redirectParam: string | null): string {
  if (
    redirectParam &&
    redirectParam.startsWith('/') &&
    !redirectParam.startsWith('//') &&
    !redirectParam.startsWith('/auth')
  ) {
    return redirectParam;
  }
  return '/dashboard';
}
