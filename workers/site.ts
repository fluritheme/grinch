import { consolidated } from './consolidation';
import { observe, record, type Database } from './traffic';
interface Env {
  CENTRAL_DB?: Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}
export default {
  async fetch(
    request: Request,
    env: Env,
    context?: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<Response> {
    const migration = consolidated(request, 'grinch');
    if (migration) return migration;
    const path = new URL(request.url).pathname;
    if (path === '/dashboard' || path.startsWith('/dashboard/'))
      return new Response(null, {
        status: 308,
        headers: {
          Location: 'https://fluri.xyz/dashboard/',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    if (path.startsWith('/api/dashboard'))
      return Response.json(
        { error: 'The dashboard is at https://fluri.xyz/dashboard/' },
        {
          status: 410,
          headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
        },
      );
    const response = await env.ASSETS.fetch(request),
      headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'sha256-LeuzFgPcemBZ1pVeCzUXHgx/E/24KkSGY8o6/b1ha3s='; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    const observation = observe(request, response);
    if (observation && env.CENTRAL_DB) {
      const work = record(env.CENTRAL_DB, observation).catch(() =>
        console.error('Traffic aggregation failed.'),
      );
      if (context) context.waitUntil(work);
      else await work;
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
