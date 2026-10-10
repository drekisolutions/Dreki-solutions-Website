import { after } from 'next/server';
import { config } from '@/lib/voice/config.mjs';
import { database } from '@/lib/voice/store.mjs';
import { handle } from '@/lib/voice/http.mjs';

export const runtime = 'nodejs';
export const preferredRegion = 'iad1';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

async function route(request: Request) {
  if (new URL(request.url).pathname === '/api/voice/health' && request.method === 'GET') {
    return Response.json({ service: 'dreki-voice', version: 1 }, { headers: { 'Cache-Control': 'no-store' } });
  }
  let pool: ReturnType<typeof database> | undefined;
  const jobs: Array<() => Promise<unknown>> = [];
  try {
    const c = config();
    pool = database();
    return await handle(request, { pool, c, after: (job: () => Promise<unknown>) => { jobs.push(job); } });
  } catch {
    return Response.json({ error: 'Voice backend unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  } finally {
    if (pool) {
      const activePool = pool;
      if (jobs.length) after(async () => {
        try { for (const job of jobs) await job(); }
        catch { console.error('Voice delivery requires reconciliation; see durable outbox.'); }
        finally { await activePool.end(); }
      });
      else await activePool.end();
    }
  }
}
export const GET = route;
export const POST = route;
