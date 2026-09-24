import { NextRequest, NextResponse } from 'next/server';

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
  const force = request.nextUrl.searchParams.get('force');
  const tickUrl = `${backendUrl.replace(/\/$/, '')}/notifications/cron/tick${
    force === '1' || force === 'true' ? '?force=1' : ''
  }`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cronSecret) {
      headers.Authorization = `Bearer ${cronSecret}`;
    }

    const res = await fetch(tickUrl, {
      method: 'POST',
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    const data: unknown = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, backend: data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
