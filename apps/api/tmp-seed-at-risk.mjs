const API = 'http://localhost:4000/api';

async function req(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(method + ' ' + path + ' ' + res.status + ' ' + JSON.stringify(data));
  }
  return data;
}

async function main() {
  const login = await req('POST', '/auth/login', null, {
    email: 'admin@ilona.edu',
    password: 'admin123',
  });
  const token = login.tokens.accessToken;
  const lessons = await req(
    'GET',
    '/lessons?take=30&dateFrom=2026-09-01T00:00:00.000Z&dateTo=2026-09-30T23:59:59.000Z',
    token,
  );
  const items = lessons.items || [];
  const lesson = items.find((l) => l.groupId || l.group?.id);
  if (!lesson) {
    throw new Error('No September lesson found. Got ' + items.length + ' lessons');
  }
  const groupId = lesson.groupId || lesson.group.id;
  const lessonId = lesson.id;
  console.log('Using lesson', lessonId, 'group', groupId, 'at', lesson.scheduledAt);

  const suffix = String(Date.now()).slice(-6);
  const studentsSpec = [
    { key: 'both', firstName: 'AtRisk', lastName: 'Both', email: 'atrisk.both.' + suffix + '@ilona.test' },
    { key: 'abs', firstName: 'AtRisk', lastName: 'AbsOnly', email: 'atrisk.abs.' + suffix + '@ilona.test' },
    { key: 'late', firstName: 'AtRisk', lastName: 'LateOnly', email: 'atrisk.late.' + suffix + '@ilona.test' },
  ];
  const created = {};
  for (const spec of studentsSpec) {
    const student = await req('POST', '/students', token, {
      email: spec.email,
      password: 'test1234',
      firstName: spec.firstName,
      lastName: spec.lastName,
      monthlyFee: 30000,
      age: 16,
      groupId,
      notes: 'UI at-risk fixture, delete after test',
    });
    created[spec.key] = student;
    console.log('Created', spec.key, student.id);
  }

  for (const key of ['both', 'late']) {
    const payment = await req('POST', '/finance/payments', token, {
      studentId: created[key].id,
      amount: 30000,
      month: '2026-08-01',
      notes: 'August unpaid fixture',
    });
    console.log('August payment', key, payment.id, payment.status, payment.month);
  }

  for (const key of ['both', 'abs']) {
    const att = await req('POST', '/attendance', token, {
      lessonId,
      studentId: created[key].id,
      isPresent: false,
      absenceType: 'UNJUSTIFIED',
    });
    console.log('Absence', key, att.id || 'ok');
  }

  const risk = await req('GET', '/analytics/students/risk', token);
  const rows = risk.filter((r) => r.name.startsWith('AtRisk '));
  console.log(
    JSON.stringify(
      rows.map((r) => ({
        name: r.name,
        riskLevel: r.riskLevel,
        isAtRisk: r.isAtRisk,
        absences: r.absenceCount,
        late: r.hasLatePayment,
      })),
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
