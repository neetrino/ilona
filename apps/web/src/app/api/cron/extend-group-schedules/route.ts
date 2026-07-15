import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Cron: extend rolling group lesson windows (90 days) via Nest API.
 * Schedule: daily (see vercel.json). Secured by CRON_SECRET when set.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  const extendUrl = `${backendUrl.replace(/\/$/, '')}/lessons/cron/extend-group-schedules`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cronSecret) {
      headers.Authorization = `Bearer ${cronSecret}`;
    }

    const res = await fetch(extendUrl, {
      method: 'POST',
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    const text = await res.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text.slice(0, 200) };
    }

    if (!res.ok) {
      console.warn(
        `[cron/extend-group-schedules] Backend returned ${res.status}: ${text.slice(0, 200)}`,
      );
      return NextResponse.json(
        { ok: false, backendStatus: res.status, backend: data },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true, backend: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[cron/extend-group-schedules] Fetch failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
