# Технологический стек: Ilona English Center

> Полный список технологий и библиотек проекта.

**Последнее обновление:** 2026-02-02

---

## 🌐 Frontend (apps/web)

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| **Framework** | Next.js | 14.x | Full-stack React framework |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Library** | React | 18.x | UI components |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **UI Components** | shadcn/ui | latest | Accessible components |
| **State (client)** | Zustand | 4.x | Client state management |
| **State (server)** | TanStack Query | 5.x | Server state, caching |
| **Forms** | React Hook Form | 7.x | Form handling |
| **Validation** | Zod | 3.x | Schema validation |
| **i18n** | next-intl | 3.x | Internationalization |
| **Icons** | Lucide React | latest | Icon library |
| **Date** | date-fns | 3.x | Date formatting |
| **Charts** | Recharts | 2.x | Analytics charts |

---

## 🔧 Backend (apps/api)

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| **Framework** | NestJS | 10.x | Backend framework |
| **Language** | TypeScript | 5.x | Type safety |
| **ORM** | Prisma | 5.x | Database ORM |
| **Validation** | class-validator | 0.14.x | DTO validation |
| **Transform** | class-transformer | 0.5.x | Object transformation |
| **Auth** | @nestjs/jwt | 10.x | JWT handling |
| **Auth** | @nestjs/passport | 10.x | Authentication |
| **WebSocket** | @nestjs/websockets | 10.x | Real-time chat |
| **WebSocket** | socket.io | 4.x | WebSocket adapter |
| **Config** | @nestjs/config | 3.x | Configuration |
| **Swagger** | @nestjs/swagger | 7.x | API documentation |
| **Queue** | BullMQ | 5.x | Background jobs |
| **Email** | Resend | latest | Email sending |

---

## 🗄️ Database & Storage

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| **Database** | PostgreSQL | 16 | Primary database |
| **DB Hosting** | Neon | - | Serverless Postgres |
| **ORM** | Prisma | 5.x | Type-safe ORM |
| **Cache** | Redis (Upstash) | - | Caching, rate limiting |
| **File Storage** | Cloudflare R2 | - | Voice messages, media |

---

## 🧪 Testing

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| **Unit/Integration** | Vitest | 1.x | Fast test runner |
| **E2E** | Playwright | 1.x | Browser testing |
| **API Testing** | Supertest | 6.x | HTTP testing |
| **Mocking** | MSW | 2.x | API mocking |

---

## 🛠️ Development Tools

| Категория | Технология | Назначение |
|-----------|------------|------------|
| **Monorepo** | Turborepo | Build system |
| **Package Manager** | pnpm | Fast, efficient |
| **Linting** | ESLint | Code quality |
| **Formatting** | Prettier | Code formatting |
| **Git Hooks** | Husky | Pre-commit hooks |
| **Commit Lint** | commitlint | Commit messages |
| **Type Check** | TypeScript | Static analysis |

---

## 🚀 Infrastructure

| Категория | Технология | Назначение |
|-----------|------------|------------|
| **Frontend Hosting** | Vercel | Next.js deployment |
| **Backend Hosting** | Railway | NestJS deployment |
| **Database** | Neon | PostgreSQL hosting |
| **Cache** | Upstash | Redis serverless |
| **Files** | Cloudflare R2 | Object storage |
| **Email** | Resend | Transactional email |
| **CDN** | Cloudflare | CDN, DNS, WAF |
| **CI/CD** | GitHub Actions | Automation |
| **Monitoring** | Sentry | Error tracking |

---

## 📦 Package Versions (package.json)

### Root (Monorepo)

```json
{
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "@commitlint/cli": "^18.6.0",
    "@commitlint/config-conventional": "^18.6.0"
  }
}
```

### apps/web (Next.js)

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-intl": "^3.4.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.312.0",
    "date-fns": "^3.2.0",
    "recharts": "^2.10.0",
    "socket.io-client": "^4.7.0"
  }
}
```

### apps/api (NestJS)

```json
{
  "dependencies": {
    "@nestjs/core": "^10.3.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.1.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/websockets": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "@nestjs/swagger": "^7.2.0",
    "@nestjs/bull": "^10.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "bcrypt": "^5.1.0",
    "bullmq": "^5.1.0",
    "resend": "^2.1.0"
  }
}
```

### packages/database (Prisma)

```json
{
  "dependencies": {
    "@prisma/client": "^5.8.0"
  },
  "devDependencies": {
    "prisma": "^5.8.0"
  }
}
```

---

## 🔄 Обновление зависимостей

### Политика обновлений

| Тип | Частота | Пример |
|-----|---------|--------|
| **Patch** (x.x.1 → x.x.2) | Сразу | Багфиксы |
| **Minor** (x.1.x → x.2.x) | В течение недели | Новые фичи |
| **Major** (1.x → 2.x) | Планирование | Breaking changes |

### Команды

```bash
# Проверка устаревших пакетов
pnpm outdated

# Обновление patch/minor
pnpm update

# Обновление с interactive
pnpm update -i
```

---

## 🔗 Полезные ссылки

- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [next-intl](https://next-intl-docs.vercel.app)
- [Turborepo](https://turbo.build/repo)

---

**Версия:** 1.0


