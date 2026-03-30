/** Same-origin path only; avoids open redirects and login loops. */
export function safeInternalAppPath(raw: string | null, fallback = '/account'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw === '/login') return fallback;
  return raw;
}
