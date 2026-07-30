/**
 * Live API smoke for co-teacher equal actions / assigned-teacher pay.
 * Skipped by default — run with:
 *   CO_TEACHER_LIVE=1 pnpm --filter @ilona/api test -- src/modules/lessons/co-teacher-live.smoke.spec.ts
 *
 * Requires local API on :4000 and demo credentials (teacher@ilona.edu / teacher123).
 */
import { describe, it, expect } from 'vitest';

const ENABLED = process.env.CO_TEACHER_LIVE === '1';
const API = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`login failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{
    user: { id: string };
    tokens: { accessToken: string };
  }>;
}

describe.skipIf(!ENABLED)('co-teacher live smoke (API)', () => {
  it('lists co-teacher lessons, opens attendance, keeps payee as assigned teacher', async () => {
    const session = await login('teacher@ilona.edu', 'teacher123');
    const headers = { Authorization: `Bearer ${session.tokens.accessToken}` };

    const meRes = await fetch(`${API}/teachers/me`, { headers });
    expect(meRes.ok).toBe(true);
    const me = (await meRes.json()) as { id: string };

    const groupsRes = await fetch(`${API}/groups?take=100`, { headers });
    expect(groupsRes.ok).toBe(true);
    const groups = (await groupsRes.json()) as {
      items: Array<{
        id: string;
        teacherId: string | null;
        secondTeacherId: string | null;
      }>;
    };

    const dualGroups = groups.items.filter(
      (g) =>
        (g.teacherId === me.id || g.secondTeacherId === me.id) &&
        g.teacherId &&
        g.secondTeacherId,
    );
    expect(dualGroups.length).toBeGreaterThan(0);

    let otherLesson: { id: string; teacherId: string } | undefined;
    for (const dual of dualGroups) {
      const lessonsRes = await fetch(
        `${API}/lessons?groupId=${dual.id}&take=50&dateFrom=2026-07-01&dateTo=2026-08-31`,
        { headers },
      );
      expect(lessonsRes.ok).toBe(true);
      const lessons = (await lessonsRes.json()) as {
        items: Array<{ id: string; teacherId: string }>;
      };
      otherLesson = lessons.items.find((l) => l.teacherId !== me.id);
      if (otherLesson) break;
    }
    expect(otherLesson).toBeTruthy();

    const attRes = await fetch(`${API}/attendance/lesson/${otherLesson!.id}`, {
      headers,
    });
    expect(attRes.ok).toBe(true);

    const detailRes = await fetch(`${API}/lessons/${otherLesson!.id}`, { headers });
    expect(detailRes.ok).toBe(true);
    const detail = (await detailRes.json()) as { teacherId: string };
    expect(detail.teacherId).toBe(otherLesson!.teacherId);
    expect(detail.teacherId).not.toBe(me.id);
  }, 30_000);
});
