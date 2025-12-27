# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a **Next.js 16** application using the **App Router** architecture.

### Technology Stack
- **Framework**: Next.js 16.1.0 (App Router)
- **Runtime**: React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 (with PostCSS)
- **Linting**: ESLint 9 with Next.js config

### Project Structure
```
src/
  app/              # App Router pages and layouts
    layout.tsx      # Root layout with Geist fonts
    page.tsx        # Home page
    globals.css     # Global Tailwind styles
```

### Key Conventions

**Path Aliases**: Use `@/*` to import from `src/*` (configured in tsconfig.json)

**Font System**: The app uses Geist Sans and Geist Mono fonts loaded via `next/font/google`. Font variables are defined in layout.tsx and applied globally.

**TypeScript Config**: Strict mode is enabled. The app uses the bundler module resolution strategy.

**ESLint**: Uses Next.js core-web-vitals and TypeScript configs. Linter ignores `.next/`, `out/`, `build/`, and `next-env.d.ts`.

**Tailwind CSS**: Version 4 with PostCSS integration. Dark mode support is included in the default setup.

## Next.js App Router Specifics

- All pages live in `src/app/` directory
- `layout.tsx` wraps all pages and defines shared UI
- `page.tsx` files define routes
- Server Components by default (use `"use client"` for client components)
- Metadata is exported from layouts and pages, not defined in a separate head file

## Clerk Authentication Integration

This project uses [Clerk](https://clerk.com/) for authentication with Next.js App Router.

### Required Implementation Pattern

**Install**: `npm install @clerk/nextjs`

**Middleware** (`proxy.ts` in `src/` directory):
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

**Layout** (`src/app/layout.tsx`): Wrap app with `<ClerkProvider>`

**Components**: Use `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignedIn>`, `<SignedOut>` from `@clerk/nextjs`

**Environment Variables** (`.env.local` only):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

### Critical Rules

**ALWAYS**:
- Use `clerkMiddleware()` from `@clerk/nextjs/server`
- Import from `@clerk/nextjs` or `@clerk/nextjs/server`
- Use `async/await` with server methods like `auth()`
- Store real keys only in `.env.local` (verify `.gitignore` excludes `.env*`)
- Use placeholder values in code examples (never real keys)

**NEVER**:
- Reference `authMiddleware()` (deprecated)
- Use `_app.tsx` or pages-based patterns
- Import from deprecated APIs (`withAuth`, old `currentUser`)
- Write real API keys to tracked files

### Verification Checklist

Before implementing Clerk features, verify:
1. `clerkMiddleware()` is used in `proxy.ts`
2. `<ClerkProvider>` wraps app in `app/layout.tsx`
3. All imports are from `@clerk/nextjs` or `@clerk/nextjs/server`
4. Using App Router structure (not pages router)
5. Only placeholder keys in code; real keys in `.env.local` only
