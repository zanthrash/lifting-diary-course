# Routing Standards

This document outlines the routing conventions and protection mechanisms for the Lifting Diary application.

## Route Structure

All application routes MUST be accessed via the `/dashboard` prefix.

### Protected Routes

- `/dashboard` - Main dashboard page (protected)
- `/dashboard/*` - All sub-pages under dashboard (protected)

**Example routes:**
```
/dashboard
/dashboard/workout/[workoutId]
/dashboard/workout/new
/dashboard/profile
```

## Route Protection

Route protection is implemented at the middleware level using Next.js middleware with Clerk authentication.

### Implementation Location

Route protection MUST be configured in `src/middleware.ts` (or `src/proxy.ts` if using that naming convention).

### Protection Pattern

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Critical Rules

**ALWAYS:**
- Protect all `/dashboard` routes using middleware
- Use `createRouteMatcher` with the pattern `/dashboard(.*)`
- Call `await auth.protect()` for matched protected routes
- Keep authentication logic in middleware (not in individual pages)

**NEVER:**
- Implement route protection in individual page components
- Leave `/dashboard` routes unprotected
- Use client-side-only authentication checks for route access

## Public Routes

Only the landing page (`/`) should be publicly accessible. All other routes should redirect through `/dashboard`.

## Authentication Flow

1. Unauthenticated user attempts to access `/dashboard/*`
2. Middleware intercepts the request via `clerkMiddleware`
3. `auth.protect()` checks authentication status
4. If not authenticated, Clerk redirects to sign-in page
5. After successful sign-in, user is redirected to originally requested route

## Verification Checklist

Before deploying routing changes:
1. ✓ All application routes use `/dashboard` prefix
2. ✓ Middleware protection is configured in `src/middleware.ts`
3. ✓ `createRouteMatcher` includes `/dashboard(.*)` pattern
4. ✓ `auth.protect()` is called for protected routes
5. ✓ Matcher config includes necessary Next.js patterns
6. ✓ Only landing page (`/`) is publicly accessible
