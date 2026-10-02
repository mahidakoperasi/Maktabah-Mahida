import { NextRequest, NextResponse } from 'next/server';
import { designPath } from '@/lib/design-schema';
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete('x-mahida-design-preview');
  headers.delete('x-mahida-design-kind');
  if (
    designPath(request.nextUrl.pathname) &&
    request.nextUrl.searchParams.get('designPreview') === '1'
  ) {
    headers.set('x-mahida-design-preview', request.nextUrl.pathname);
    const kind = request.nextUrl.searchParams.get('designKind');
    if (kind === 'media' || kind === 'content')
      headers.set('x-mahida-design-kind', kind);
  }
  const response = NextResponse.next({ request: { headers } });
  if (request.nextUrl.searchParams.has('designPreview'))
    response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!api|_next|brand|favicon.ico).*)'] };
