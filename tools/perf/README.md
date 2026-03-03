# Performance log parser

Parses backend request summary logs (JSON lines with `message: "request_summary"`) and outputs per-route metrics.

## Capture logs

1. Run backend (e.g. `pnpm run dev` from repo root or `apps/api`).
2. Run verification scenarios (see PERFORMANCE-CLOSURE-REPORT.md §3).
3. Redirect stdout to a file per scenario, e.g.:
   - Scenario A: capture 3 min after login → dashboard → idle → save as `tools/perf/logs/scenario-A.log`.
   - Or pipe: `pnpm run dev 2>&1 | tee tools/perf/logs/capture.log`, then split by time window.

Ensure each log line includes the JSON summary (backend must log with `ts` and `message: "request_summary"`).

## Run parser

```bash
node tools/perf/parse-logs.js tools/perf/logs/scenario-A.log
```

Output:

- `tools/perf/results-<scenario>.json` — full metrics.
- Markdown table printed to stdout (paste into closure report).

## Reproduce measurements

1. Capture one log file per scenario (A–F) into `tools/perf/logs/scenario-*.log`.
2. For each file: `node tools/perf/parse-logs.js tools/perf/logs/scenario-X.log`.
3. Paste the printed Markdown tables into PERFORMANCE-CLOSURE-REPORT.md §3 (Measured Results After).
