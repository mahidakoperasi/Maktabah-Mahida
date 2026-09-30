import type { NextRequest } from 'next/server';

// Host preserves the public hostname through the existing Nginx proxy. nextUrl
// can contain the internal app hostname, so it cannot be used for this comparison.
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Non-browser authenticated API clients.
  try {
    const url = new URL(origin);
    const host =
      request.headers.get('host')?.toLowerCase() || request.nextUrl.host;
    const localHttp =
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (
      (url.protocol === 'https:' || localHttp) &&
      url.host.toLowerCase() === host
    );
  } catch {
    return false;
  }
}
