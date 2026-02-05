## Lint & Typecheck Workflow Rules

**Always follow these steps before and after any task in this repo.**

### Before any task
- **1) Run lint (recursive):**

  ```bash
  pnpm -r lint
  ```

- **2) Run typecheck (recursive):**

  ```bash
  pnpm -r typecheck
  ```

- **3) If errors exist:**
  - **Fix them first** with minimal, type-safe changes.
  - Do **not** change business logic or feature behavior when fixing lint/TS errors.
  - Prefer:
    - Narrowing types instead of using `any`.
    - Adding `void` in front of intentionally un-awaited Promises.
    - Adjusting configs or tests rather than core runtime logic, when possible.

### During a task
- **Read this file before starting any task.**
- Keep fixes **small and localized**:
  - Update tests and type definitions where needed.
  - Use ESLint disable comments only as a last resort and keep them **scoped and justified**.

### After finishing a task
- **1) Re-run lint (recursive):**

  ```bash
  pnpm -r lint
  ```

- **2) Re-run typecheck (recursive):**

  ```bash
  pnpm -r typecheck
  ```

- **3) If new lint/TS errors appear:**
  - Treat them as part of the task and fix them before considering the task done.
  - Ensure no new `any` leaks into core types or APIs.

- **4) Final state:**
  - `pnpm -r lint` passes.
  - `pnpm -r typecheck` passes.






