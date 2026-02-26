import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Cron endpoint: pings the NestJS backend /warmup to prevent Render cold start.
 * Schedule: every 10 minutes (see vercel.json).
 * Secured by CRON_SECRET when set in Vercel environment.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api';
  const warmupUrl = `${backendUrl.replace(/\/$/, '')}/warmup`;

  try {
    const res = await fetch(warmupUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[cron/warmup] Backend returned ${res.status}: ${text.slice(0, 200)}`);
      return NextResponse.json(
        { ok: false, backendStatus: res.status },
        { status: 200 }
      );
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, backend: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[cron/warmup] Fetch failed:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 200 }
    );
  }
}
