# Ilona English Center

> Platform for managing English learning centers with multi-center support, real-time chat, attendance tracking, and automated salary calculations.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL (or Neon account)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ilona-english-center.git
cd ilona-english-center

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Development URLs

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (NestJS) | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api/docs |
| Prisma Studio | http://localhost:5555 |

---

## 📁 Project Structure

```
ilona-english-center/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend
├── packages/
│   ├── database/               # Prisma schema & client
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
├── docs/                       # Documentation
└── ...config files
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean all build outputs |

### Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database (dev) |
| `pnpm db:migrate` | Run migrations (production) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed the database |

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access: centers, teachers, students, finance, analytics |
| **Teacher** | Lessons, attendance, feedback, salary tracking |
| **Student** | Lessons, payments, recordings, chat |

---

## 🌐 Internationalization

The platform supports two languages:
- **English** (default)
- **Armenian** (Հայերdelays)

Language files are located in `apps/web/languages/`.

---

## 📖 Documentation

- [Architecture](./docs/01-ARCHITECTURE.md)
- [Tech Stack](./docs/02-TECH_STACK.md)
- [Database Schema](./docs/05-DATABASE.md)
- [Progress](./docs/PROGRESS.md)

---

## 🔐 Environment Variables

See [.env.example](./.env.example) for all required environment variables.

---

## 📄 License

Private - All rights reserved.


