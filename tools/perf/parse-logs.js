#!/usr/bin/env node
/**
 * Parse backend request summary logs and compute per-route metrics.
 * Input: raw backend stdout log file (JSON summary lines with message "request_summary" or requestId+route+dbQueryCount).
 * Output: tools/perf/results.json + Markdown table to paste into PERFORMANCE-CLOSURE-REPORT.md.
 *
 * Usage:
 *   node tools/perf/parse-logs.js <log-file>
 *   node tools/perf/parse-logs.js tools/perf/logs/scenario-A.log
 *
 * Log line format: Nest may prefix JSON with "[Nest] ... LOG [LoggingInterceptor] ";
 * this script extracts JSON from the first { to the last } on each line.
 */

const fs = require('fs');
const path = require('path');

const logPath = process.argv[2];
if (!logPath || !fs.existsSync(logPath)) {
  console.error('Usage: node tools/perf/parse-logs.js <log-file>');
  process.exit(1);
}

const logContent = fs.readFileSync(logPath, 'utf8');
const lines = logContent.split('\n');

function extractJson(line) {
  const start = line.indexOf('{');
  const end = line.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(line.slice(start, end + 1));
  } catch {
    return null;
  }
}

function isSummaryEntry(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    (obj.message === 'request_summary' || (obj.requestId != null && obj.route != null && typeof obj.dbQueryCount === 'number'))
  );
}

function p95(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const scenarioName = path.basename(logPath, path.extname(logPath));
const entries = [];
for (const line of lines) {
  const obj = extractJson(line);
  if (isSummaryEntry(obj)) {
    entries.push({
      ts: obj.ts || null,
      requestId: obj.requestId,
      route: obj.route,
      method: obj.method,
      status: obj.status,
      durationMs: typeof obj.durationMs === 'number' ? obj.durationMs : 0,
      dbQueryCount: typeof obj.dbQueryCount === 'number' ? obj.dbQueryCount : 0,
      dbTimeMs: typeof obj.dbTimeMs === 'number' ? obj.dbTimeMs : 0,
    });
  }
}

if (entries.length === 0) {
  const resultsEmpty = {
    scenario: scenarioName,
    logFile: path.basename(logPath),
    totalRequests: 0,
    byRoute: [],
    note: 'No request_summary entries in window (e.g. background tab = 0 req/min).',
  };
  const outDir = path.join(path.dirname(logPath), '..');
  const resultsPath = path.join(outDir, `results-${scenarioName}.json`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(resultsEmpty, null, 2), 'utf8');
  console.log('Wrote', resultsPath, '(0 entries)');
  console.log('\n--- Markdown table (paste into closure report) ---\n');
  console.log('| Route | Requests | Req/min | avg dbQueryCount | p95 dbQueryCount | avg dbTimeMs | p95 dbTimeMs |');
  console.log('|-------|----------|---------|------------------|------------------|--------------|--------------|');
  console.log('| (no requests in window) | 0 | 0 | — | — | — | — |');
  process.exit(0);
}

const firstTs = entries.map((e) => e.ts).filter(Boolean)[0];
const lastTs = entries.map((e) => e.ts).filter(Boolean).pop();
let timeSpanMin = 1;
if (firstTs && lastTs) {
  const first = new Date(firstTs).getTime();
  const last = new Date(lastTs).getTime();
  timeSpanMin = Math.max(0.016, (last - first) / (60 * 1000));
}

const byRoute = {};
for (const e of entries) {
  const r = e.route || '(unknown)';
  if (!byRoute[r]) {
    byRoute[r] = { count: 0, durationMs: [], dbQueryCount: [], dbTimeMs: [] };
  }
  byRoute[r].count += 1;
  byRoute[r].durationMs.push(e.durationMs);
  byRoute[r].dbQueryCount.push(e.dbQueryCount);
  byRoute[r].dbTimeMs.push(e.dbTimeMs);
}

const routeMetrics = [];
for (const [route, data] of Object.entries(byRoute)) {
  const reqPerMin = data.count / timeSpanMin;
  routeMetrics.push({
    route,
    requestCount: data.count,
    timeSpanMin: Math.round(timeSpanMin * 100) / 100,
    requestsPerMin: Math.round(reqPerMin * 100) / 100,
    avgDbQueryCount: Math.round(avg(data.dbQueryCount) * 100) / 100,
    p95DbQueryCount: p95(data.dbQueryCount),
    avgDbTimeMs: Math.round(avg(data.dbTimeMs) * 100) / 100,
    p95DbTimeMs: p95(data.dbTimeMs),
    avgDurationMs: Math.round(avg(data.durationMs) * 100) / 100,
    p95DurationMs: p95(data.durationMs),
  });
}
routeMetrics.sort((a, b) => b.requestCount - a.requestCount);

const results = {
  scenario: scenarioName,
  logFile: path.basename(logPath),
  firstTs,
  lastTs,
  timeSpanMin: Math.round(timeSpanMin * 100) / 100,
  totalRequests: entries.length,
  byRoute: routeMetrics,
};

const outDir = path.join(path.dirname(logPath), '..');
const resultsPath = path.join(outDir, `results-${scenarioName}.json`);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Wrote', resultsPath);

console.log('\n--- Markdown table (paste into closure report) ---\n');
console.log('| Route | Requests | Req/min | avg dbQueryCount | p95 dbQueryCount | avg dbTimeMs | p95 dbTimeMs | avg durationMs | p95 durationMs |');
console.log('|-------|----------|---------|------------------|------------------|--------------|--------------|----------------|----------------|');
for (const m of routeMetrics) {
  console.log(
    `| ${m.route} | ${m.requestCount} | ${m.requestsPerMin} | ${m.avgDbQueryCount} | ${m.p95DbQueryCount} | ${m.avgDbTimeMs} | ${m.p95DbTimeMs} | ${m.avgDurationMs} | ${m.p95DurationMs} |`
  );
}
console.log('\n--- End ---');
