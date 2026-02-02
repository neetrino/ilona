# Auth — Полная настройка

> Аутентификация пользователей: Clerk (рекомендуется) и NextAuth (альтернатива).

---

## 📋 СОДЕРЖАНИЕ

### Clerk (рекомендуется для SaaS)
1. [Создание аккаунта Clerk](#clerk-аккаунт)
2. [Интеграция с Next.js](#clerk-nextjs)
3. [Защита routes](#clerk-protection)
4. [Пользовательские данные](#clerk-user-data)
5. [Webhooks](#clerk-webhooks)

### NextAuth (альтернатива)
6. [Настройка NextAuth](#nextauth-setup)
7. [Providers](#nextauth-providers)
8. [Database Adapter](#nextauth-database)

9. [Checklist](#checklist)

---

# CLERK

## 1. Создание аккаунта Clerk {#clerk-аккаунт}

### Шаги:

1. Перейти на [clerk.com](https://clerk.com)
2. "Get Started" → GitHub / Google / Email
3. Создать Application

### Pricing:

| План | Стоимость | MAU |
|------|-----------|-----|
| Free | $0 | 10,000 |
| Pro | $25/month | 10,000 + $0.02/MAU |
| Enterprise | Custom | Unlimited |

### После создания:

Получить ключи:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

---

## 2. Интеграция с Next.js {#clerk-nextjs}

### Установка:

```bash
npm install @clerk/nextjs
```

### Environment Variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# URLs (опционально)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Middleware:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Provider:

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Sign In / Sign Up Pages:

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

---

## 3. Защита routes {#clerk-protection}

### Server Component:

```tsx
// app/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
    </div>
  );
}
```

### Client Component:

```tsx
'use client';

import { useUser, useAuth, SignedIn, SignedOut } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  
  if (!isLoaded) return <div>Loading...</div>;
  
  return (
    <>
      <SignedIn>
        <p>Hello, {user?.firstName}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </SignedIn>
      
      <SignedOut>
        <a href="/sign-in">Sign In</a>
      </SignedOut>
    </>
  );
}
```

### API Route:

```typescript
// app/api/user/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Получить данные пользователя из БД
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  
  return NextResponse.json(user);
}
```

---

## 4. Пользовательские данные {#clerk-user-data}

### Синхронизация с БД:

```typescript
// lib/user.ts
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw new Error('Not authenticated');
  }
  
  // Найти или создать в БД
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
        imageUrl: clerkUser.imageUrl,
      },
    });
  }
  
  return user;
}
```

### Prisma Schema:

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  imageUrl  String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  orders    Order[]
  
  @@index([clerkId])
}

enum Role {
  USER
  ADMIN
}
```

---

## 5. Webhooks {#clerk-webhooks}

### Настройка в Clerk Dashboard:

1. Webhooks → "Add Endpoint"
2. URL: `https://your-app.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Получить `CLERK_WEBHOOK_SECRET`

### Обработчик:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  
  // Получить headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }
  
  // Получить body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  // Верифицировать
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Обработать событие
  switch (evt.type) {
    case 'user.created':
      await prisma.user.create({
        data: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address ?? '',
          name: `${evt.data.first_name} ${evt.data.last_name}`.trim(),
          imageUrl: evt.data.image_url,
        },
      });
      break;
      
    case 'user.updated':
      await prisma.user.update({
        where: { clerkId: evt.data.id },
        data: {
          email: evt.data.email_addresses[0]?.email_address,
          name: `${evt.data.first_name} ${evt.data.last_name}`.trim(),
          imageUrl: evt.data.image_url,
        },
      });
      break;
      
    case 'user.deleted':
      await prisma.user.delete({
        where: { clerkId: evt.data.id },
      });
      break;
  }
  
  return new Response('OK', { status: 200 });
}
```

---

# NEXTAUTH

## 6. Настройка NextAuth {#nextauth-setup}

### Установка:

```bash
npm install next-auth@beta
```

### Конфигурация:

```typescript
// auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        
        if (!user || !user.password) {
          return null;
        }
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

### Route Handlers:

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

### Middleware:

```typescript
// middleware.ts
import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard');
  
  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', req.nextUrl));
  }
  
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 7. Providers {#nextauth-providers}

### GitHub:

1. GitHub → Settings → Developer settings → OAuth Apps
2. New OAuth App:
   - Homepage URL: `https://your-app.com`
   - Callback URL: `https://your-app.com/api/auth/callback/github`

```bash
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Google:

1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-app.com/api/auth/callback/google`

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

---

## 8. Database Adapter {#nextauth-database}

### Prisma Schema:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Для Credentials provider
  accounts      Account[]
  sessions      Session[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}
```

---

## ✅ Checklist {#checklist}

### Clerk:

- [ ] Аккаунт создан
- [ ] Application создано
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY добавлен
- [ ] CLERK_SECRET_KEY добавлен
- [ ] ClerkProvider в layout
- [ ] Middleware настроен
- [ ] Sign In/Up pages созданы
- [ ] Webhooks настроены (для синхронизации с БД)

### NextAuth:

- [ ] next-auth установлен
- [ ] auth.ts настроен
- [ ] Providers настроены (GitHub, Google, etc.)
- [ ] Database adapter настроен
- [ ] Middleware настроен
- [ ] AUTH_SECRET добавлен

### Общее:

- [ ] Protected routes работают
- [ ] User data синхронизируется с БД
- [ ] Sign out работает
- [ ] Error handling настроен

---

**Версия:** 1.0
