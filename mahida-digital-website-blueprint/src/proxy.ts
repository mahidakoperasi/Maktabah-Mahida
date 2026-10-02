import { NextRequest, NextResponse } from 'next/server';
import { validTarget } from '@/lib/publication-schema';
import { designPath } from '@/lib/design-schema';
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete('x-mahida-design-preview');
  headers.delete('x-mahida-design-kind');
  headers.delete('x-mahida-publication-preview');
  headers.set('x-mahida-public-path', request.nextUrl.pathname);
  const target = request.nextUrl.searchParams.get('publicationPreview');
  if (target && validTarget(target)) headers.set('x-mahida-publication-preview', target);
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
  if (request.nextUrl.searchParams.has('designPreview') || target)
    response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!api|_next|brand|favicon.ico).*)'] };
