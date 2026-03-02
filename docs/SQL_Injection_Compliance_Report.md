# SQL Injection Security Checklist — Compliance Report

**Project:** ilona-english-center-gugo  
**Checklist:** `docs/SQL Injection Security Checklist.md`  
**Scope:** Backend API (`apps/api`) and database usage (Prisma, raw SQL, scripts)  
**Date:** 2025-03-02  
**Mode:** Analysis only — no code changes.

---

## 1) Compliance Summary

| Overall status | **Partially Compliant** |
|----------------|--------------------------|
| Explanation   | The API uses Prisma for all runtime queries, no unsafe raw SQL in request path, and no string concatenation for SQL. Parameterization and error handling are in place. **Failures:** (1) Database scripts use `$queryRawUnsafe` / `$executeRawUnsafe`; (2) `sortBy` is not whitelisted in DTOs for students, teachers, and lessons (only in service logic); (3) Rate limiting and some checklist items (DB rights, WAF, dependency scanning, security tests) are not verified or not present. |

---

## 2) Detailed Breakdown (by Checklist Rules)

### 1. Архитектурный уровень (Architectural level)

| Rule | Status | Explanation |
|------|--------|-------------|
| Все запросы выполняются через ORM (Prisma) | ✅ OK | All API data access uses Prisma (`apps/api/src/modules/*`). No TypeORM/Knex. |
| Нет ручной конкатенации SQL-строк | ✅ OK | No `+` or template literal concatenation of SQL with user input. |
| Не используется queryRawUnsafe / executeRawUnsafe | ⚠️ Risk | **API:** Not used. **Scripts:** Used in `packages/database/scripts/apply-migration.js`, `add-color-hex-column.js`, `apply-color-hex-migration.ts`. Checklist rule is global; scripts use static SQL only (no user input). |
| Все raw-запросы параметризованы | ✅ OK | API raw usage: `apps/api/src/modules/settings/settings.service.ts` and `apps/api/src/app.controller.ts`, `apps/api/src/modules/prisma/prisma.service.ts` use `$queryRaw` / `$executeRaw` **tagged template literals** only (no interpolated user input). |

---

### 2. Параметризация запросов (Query parameterization)

| Rule | Status | Explanation |
|------|--------|-------------|
| Ни один SQL не содержит `${userInput}` в строке | ✅ OK | No raw SQL built from request/body/query in API. |
| Используются prepared statements (? / $1 / param через ORM) | ✅ OK | Prisma uses parameterized queries; `where: { email }`, `where: { id }` etc. (e.g. `users.service.ts`, `auth.service.ts` → `findByEmail`). |
| Нет динамической вставки в WHERE/INSERT/UPDATE | ✅ OK | All filters/updates go through Prisma `where` / `data` objects. |
| Все фильтры через безопасный API ORM | ✅ OK | Filtering/search via Prisma `where` (e.g. `student-crud.service.ts`, `lesson-crud.service.ts`, `teacher-crud.service.ts`, `leads.service.ts`). |
| Нет строковой сборки WHERE вручную | ✅ OK | No manual `WHERE ... AND ...` string building. |

---

### 3. Опасные места — ORDER BY, LIMIT, колонки, таблицы (High-risk areas)

| Rule | Status | Explanation |
|------|--------|-------------|
| ORDER BY | ✅ OK | All ordering via Prisma `orderBy`. No raw ORDER BY from user. |
| LIMIT / OFFSET | ✅ OK | Pagination via Prisma `skip`/`take`; values from validated DTOs (e.g. `QueryLessonDto`, `QueryStudentDto` with `@IsInt()`, `@Min()`, `@Max()`). Exception: `lessons.controller.ts` `getUpcomingLessons` uses `@Query('limit')` with no DTO/max cap. |
| Названия колонок / таблиц | ✅ OK | Not taken from user; Prisma schema only. |
| Сложные отчёты / админ-поиск / экспорт / фильтры CRM | ✅ OK | Implemented via Prisma (e.g. `salary-record.service.ts`, `analytics.service.ts`, `leads.service.ts`, `student-crud.service.ts`). |

#### 3.1 Whitelist

| Rule | Status | Explanation |
|------|--------|-------------|
| Сортировка по whitelist колонок | ⚠️ Risk | **CRM leads:** `query-lead.dto.ts` has `@IsIn(['createdAt', 'updatedAt'])` for `sortBy` ✅. **Students:** `query-student.dto.ts` has `sortBy?: string` (no whitelist); service restricts to `'student' \| 'monthlyFee' \| 'absence'` in `student-crud.service.ts`. **Teachers:** `query-teacher.dto.ts` has `sortBy?: string`; service uses switch in `teacher-crud.service.ts` (students/teacher/groups/lessons + default). **Lessons:** `query-lesson.dto.ts` has `sortBy?: string`; service uses only `'scheduledAt' \| 'dateTime'` in `lesson-crud.service.ts`. So whitelist is in **service layer only**; DTOs allow any string. |
| Направление сортировки строго asc/desc | ✅ OK | `sortOrder` validated with `@IsEnum(['asc', 'desc'])` or `@IsIn(['asc', 'desc'])` in relevant DTOs. |
| Нет произвольного имени поля | ⚠️ Risk | Same as above: DTOs do not restrict `sortBy` for students/teachers/lessons; only service logic does. |

---

### 4. Проверка кода (Code search)

| Search term | Found | Status |
|-------------|--------|--------|
| `SELECT ` / `INSERT ` / `UPDATE ` / `DELETE ` | Yes | Only in static raw SQL in `settings.service.ts`, `app.controller.ts`, `prisma.service.ts`, and in `packages/database/scripts/*`. No user-driven SQL. ✅ |
| `queryRaw` / `executeRaw` | Yes | Only tagged template usage in API (e.g. `$queryRaw` / `$executeRaw` with template literals, no interpolation). ✅ |
| `raw(` | No | Not used. ✅ |
| `${` in SQL context | No | No string interpolation in SQL. ✅ |
| `+ req.body` / `+ req.query` | No | Not used. ✅ |

**Conclusion:** No parameterization or concatenation issues found in API code.

---

### 5. Валидация ввода (Input validation)

| Rule | Status | Explanation |
|------|--------|-------------|
| Schema validation (Zod / class-validator / Joi) | ✅ OK | class-validator used in DTOs; global `ValidationPipe` in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. |
| Ограничены типы (number, enum, string length) | ✅ OK | DTOs use `@IsInt()`, `@Min()`, `@Max()`, `@IsEnum()`, `@IsIn()`, `@MaxLength()`, `@IsDateString()`, etc. |
| Нет "any" для входящих параметров | ⚠️ Risk | `sortBy` in `QueryStudentDto`, `QueryTeacherDto`, `QueryLessonDto` is plain `string` with no enum/whitelist. |
| Ограничена длина строк | ✅ OK | Many DTOs use `@MaxLength()` (e.g. create/update DTOs, feedback, chat, centers). |

---

### 6. Права пользователя БД (Database user rights)

| Rule | Status | Explanation |
|------|--------|-------------|
| Приложение не использует superuser / нет DROP DATABASE / CREATE EXTENSION / доступ только к нужным таблицам / отдельный пользователь для миграций | ⬜ Not verified | Not auditable from codebase; depends on environment and DB configuration. No evidence of superuser in code. |

---

### 7. Ошибки и логирование (Errors and logging)

| Rule | Status | Explanation |
|------|--------|-------------|
| Пользователю не показываются SQL-ошибки | ✅ OK | `AllExceptionsFilter` (`common/filters/http-exception.filter.ts`): in production, non-HTTP exceptions result in generic `"Internal server error"`; no raw Prisma/SQL message in response. |
| Stack trace скрыт в production | ✅ OK | Same filter: `stack` included in response only when **not** production. |
| Логи не содержат пароли и токены | ✅ OK | Auth flow uses `findByEmail`; response excludes `passwordHash`; auth logging uses email/user id, not password or tokens. |

---

### 8. Дополнительная защита (Additional protection)

| Rule | Status | Explanation |
|------|--------|-------------|
| Rate limiting | ⚠️ Risk | No `Throttle`/rate-limit middleware or guard found in `apps/api`. Only a comment in `prisma.service.ts` about "rate-limited" reconnects. |
| WAF | ⬜ Not verified | Not found in codebase. |
| Dependency scanning | ⬜ Not verified | Not verified in this audit. |
| Security tests | ⬜ Not verified | E2E and unit tests exist; no dedicated SQL injection tests found. |

---

### 9. Ручной тест (Manual test)

| Rule | Status | Explanation |
|------|--------|-------------|
| Попробовать передать ' OR 1=1 -- и т.д. | ⬜ Not run | Analysis-only; no manual testing performed. |

---

## 3) Risk Level and High-Risk Vectors

### Overall risk level: **Low to medium**

- **No high-risk SQL injection vectors** were found in the **API**: all queries go through Prisma with parameterized inputs; raw SQL is static and uses tagged templates.
- **Medium/low concerns:**
  1. **Database scripts** (`packages/database/scripts/`): Use `$queryRawUnsafe` / `$executeRawUnsafe`. SQL is static (no user input). Risk is **low** for injection but **fails** the checklist rule.
  2. **sortBy without DTO whitelist**: Students, teachers, and lessons accept any string for `sortBy` at DTO level; service layer restricts to a fixed set. If future code ever used `sortBy` in raw SQL or dynamic column names, it would become risky. **Current usage:** in-memory or Prisma `orderBy` with a whitelist in code — **low** current risk.
  3. **getUpcomingLessons `limit`**: Not validated (no max); could be used for DoS. Not an SQL injection issue.

### Endpoints that are most exposed to “query shape” (sort/filter)

- List endpoints that take `sortBy` / `sortOrder` / `search` / filters:
  - **Students:** `GET` (e.g. students list) — `sortBy`, `sortOrder`, `search`, `groupId`, `groupIds`, `status`, etc.
  - **Teachers:** `GET` (teachers list) — `sortBy`, `sortOrder`, `search`, `status`.
  - **Lessons:** `GET` (lessons list) — `sortBy`, `sortOrder`, `q` (search), `groupId`, `teacherId`, `status`, `dateFrom`, `dateTo`.
  - **CRM leads:** `GET` (leads list) — `sortBy`, `sortOrder`, `search`, filters.

All of these use Prisma and service-level or DTO-level constraints; **none** pass user input into raw SQL. The main improvement is to **whitelist `sortBy` in DTOs** for students, teachers, and lessons to align with the checklist.

---

## 4) Violations Summary (for implementation phase)

1. **Unsafe raw in scripts**  
   - **Files:** `packages/database/scripts/apply-migration.js`, `packages/database/scripts/add-color-hex-column.js`, `packages/database/scripts/apply-color-hex-migration.ts`.  
   - **Rule:** Checklist §1.1 — не использовать `queryRawUnsafe` / `executeRawUnsafe`.  
   - **Suggestion:** Prefer Prisma migrations or, if raw SQL is required, use tagged `$queryRaw`/`$executeRaw` with parameters where applicable; avoid `*Unsafe` with string concatenation.

2. **sortBy not whitelisted in DTOs**  
   - **Files:** `apps/api/src/modules/students/dto/query-student.dto.ts`, `apps/api/src/modules/teachers/dto/query-teacher.dto.ts`, `apps/api/src/modules/lessons/dto/query-lesson.dto.ts`.  
   - **Rule:** Checklist §3.1 — whitelist для сортировки.  
   - **Suggestion:** Add `@IsIn([...])` or enum for `sortBy` to match the service whitelist (e.g. students: `'student' | 'monthlyFee' | 'absence'`; teachers: `'students' | 'teacher' | 'groups' | 'lessons'`; lessons: `'scheduledAt' | 'dateTime'`).

3. **Rate limiting**  
   - **Rule:** Checklist §8.  
   - **Suggestion:** Add global or route-level rate limiting (e.g. `@nestjs/throttler`) if not already present elsewhere.

4. **getUpcomingLessons `limit`**  
   - **File:** `apps/api/src/modules/lessons/lessons.controller.ts`.  
   - **Suggestion:** Validate `limit` (e.g. via DTO with `@IsInt()`, `@Min(1)`, `@Max(100)` or similar) to reduce DoS risk.

---

## 5) Implementation Completed (post-audit)

The following fixes have been applied:

| # | Item | Change |
|---|------|--------|
| 1 | Unsafe raw in scripts | Replaced `$queryRawUnsafe` / `$executeRawUnsafe` with tagged `$queryRaw` / `$executeRaw` in `packages/database/scripts/apply-migration.js`, `add-color-hex-column.js`, `apply-color-hex-migration.ts`. |
| 2 | sortBy whitelist in DTOs | Added `@IsIn([...])` for `sortBy` in `query-student.dto.ts`, `query-teacher.dto.ts`, `query-lesson.dto.ts` (teachers also include `obligation`, `deduction`, `cost`). |
| 3 | Rate limiting | Added `@nestjs/throttler`, `ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }])`, global `ThrottlerGuard`; `@SkipThrottle({ default: true })` on `AppController`. |
| 4 | getUpcomingLessons limit | Added `GetUpcomingLessonsQueryDto` with `limit` validated `@Min(1)` `@Max(100)`; used in `GET /lessons/upcoming`. |

---

**Report end.**
