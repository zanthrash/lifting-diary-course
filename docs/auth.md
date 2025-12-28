# Authentication Documentation

## Overview

This application uses [Clerk](https://clerk.com/) for authentication with Next.js App Router. Clerk provides a complete user management and authentication solution with built-in UI components, middleware, and session management.

## Coding Standards

### Required Package

```bash
npm install @clerk/nextjs
```

### Environment Variables

Authentication keys **MUST** be stored in `.env.local` (never committed to version control):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Critical Rules**:
- ✅ Store real keys only in `.env.local`
- ✅ Verify `.gitignore` excludes `.env*` files
- ❌ Never commit real API keys to the repository
- ❌ Never use placeholder keys in `.env.local`

### Middleware Configuration

Authentication middleware **MUST** be configured in `src/proxy.ts`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Critical Rules**:
- ✅ Use `clerkMiddleware()` from `@clerk/nextjs/server`
- ✅ Place middleware in `src/proxy.ts`
- ❌ Never use deprecated `authMiddleware()`
- ❌ Never use pages router middleware patterns

### Root Layout Configuration

Wrap the entire application with `<ClerkProvider>` in `src/app/layout.tsx`:

```typescript
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

**Critical Rules**:
- ✅ `<ClerkProvider>` must wrap all content
- ✅ Place provider at the root layout level
- ❌ Never use `_app.tsx` patterns (pages router)

### Client-Side Authentication Components

Use Clerk's pre-built UI components for authentication flows:

```typescript
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut
} from '@clerk/nextjs';

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

**Available Components**:
- `<SignInButton>` - Triggers sign-in flow
- `<SignUpButton>` - Triggers sign-up flow
- `<UserButton>` - User profile dropdown
- `<SignedIn>` - Renders children only when user is signed in
- `<SignedOut>` - Renders children only when user is signed out

**Critical Rules**:
- ✅ Use `mode="modal"` for modal-based authentication UI
- ✅ Always pair `<SignedIn>` and `<SignedOut>` for conditional rendering
- ✅ Import from `@clerk/nextjs` for client components
- ❌ Never implement custom authentication forms (use Clerk components)

### Server-Side Authentication

Access user information in Server Components and Route Handlers:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';

// Server Component
export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  // Fetch user data
  return <div>Welcome, user {userId}</div>;
}

// Route Handler
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({ userId });
}
```

**For detailed user information**:

```typescript
import { currentUser } from '@clerk/nextjs/server';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
      <p>Name: {user.firstName} {user.lastName}</p>
    </div>
  );
}
```

**Critical Rules**:
- ✅ Always use `async/await` with `auth()` and `currentUser()`
- ✅ Import from `@clerk/nextjs/server` for server-side code
- ✅ Check for `null` or `undefined` user data
- ❌ Never use deprecated server APIs
- ❌ Never use client-side auth methods in Server Components

### Protected Routes

Protect routes using middleware or component-level checks:

**Option 1: Middleware-based protection** (recommended for multiple routes):

```typescript
// src/proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/api/protected(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

**Option 2: Component-level protection**:

```typescript
// src/app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return <div>Protected content</div>;
}
```

**Critical Rules**:
- ✅ Use `auth.protect()` for automatic redirects
- ✅ Use `createRouteMatcher()` for pattern-based route protection
- ✅ Redirect unauthenticated users to public pages
- ❌ Never rely solely on client-side protection

### Import Patterns

**Client Components**:
```typescript
import { SignInButton, UserButton } from '@clerk/nextjs';
```

**Server Components & Route Handlers**:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
```

**Critical Rules**:
- ✅ Always import from `@clerk/nextjs` or `@clerk/nextjs/server`
- ❌ Never import from deprecated paths
- ❌ Never mix client and server imports incorrectly

## Common Patterns

### Conditional Rendering Based on Auth State

```typescript
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <h1>Welcome! Please sign in.</h1>
      </SignedOut>
      <SignedIn>
        <h1>Welcome back!</h1>
      </SignedIn>
    </>
  );
}
```

### Accessing User Data in API Routes

```typescript
// src/app/api/user/route.ts
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await currentUser();

  return Response.json({
    userId: user?.id,
    email: user?.emailAddresses[0].emailAddress,
  });
}
```

### Type-Safe User Data

```typescript
import { currentUser } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

async function getUserProfile(): Promise<User | null> {
  return await currentUser();
}
```

## Anti-Patterns (DO NOT USE)

❌ **Deprecated authMiddleware**:
```typescript
// WRONG - deprecated
import { authMiddleware } from '@clerk/nextjs';
```

❌ **Pages Router patterns**:
```typescript
// WRONG - this is pages router, not app router
import { withClerkMiddleware } from '@clerk/nextjs';
```

❌ **Hardcoded API keys**:
```typescript
// WRONG - never hardcode keys
const CLERK_KEY = 'pk_test_abc123';
```

❌ **Synchronous auth calls**:
```typescript
// WRONG - auth() must be awaited
const { userId } = auth(); // Missing await
```

## Troubleshooting

### Issue: Authentication not working
- Verify `.env.local` contains correct keys
- Ensure `clerkMiddleware()` is properly configured in `src/proxy.ts`
- Check that `<ClerkProvider>` wraps the app in `layout.tsx`
- Restart dev server after changing environment variables

### Issue: Middleware errors
- Ensure using `clerkMiddleware()` not deprecated `authMiddleware()`
- Verify middleware matcher configuration is correct
- Check that imports are from `@clerk/nextjs/server`

### Issue: User data not available
- Always use `await` with `auth()` and `currentUser()`
- Check for null/undefined before accessing user properties
- Verify user is authenticated before accessing user data

## Additional Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk App Router Guide](https://clerk.com/docs/references/nextjs/overview)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)
