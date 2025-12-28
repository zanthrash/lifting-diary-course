# Server Components

**CRITICAL**: This document outlines the required patterns for Server Components in this Next.js 16 application.

## Core Principles

### 1. Params and SearchParams Are Promises

**CRITICAL**: In Next.js 15+, both `params` and `searchParams` are asynchronous and MUST be awaited.

This is a breaking change from Next.js 14 where these were synchronous objects. Failing to await these promises will cause runtime errors.

✅ **CORRECT - Dynamic Route with Params**:
```typescript
// app/dashboard/workout/[workoutId]/page.tsx

type Params = Promise<{ workoutId: string }>;

export default async function WorkoutPage({
  params,
}: {
  params: Params;
}) {
  // ✅ MUST await params
  const { workoutId } = await params;

  const workout = await getWorkout(parseInt(workoutId, 10));

  return <div>{workout.name}</div>;
}
```

❌ **NEVER DO THIS**:
```typescript
// app/dashboard/workout/[workoutId]/page.tsx

export default async function WorkoutPage({
  params,
}: {
  params: { workoutId: string };  // ❌ WRONG - Not typed as Promise
}) {
  // ❌ WRONG - Not awaited
  const { workoutId } = params;

  const workout = await getWorkout(parseInt(workoutId, 10));

  return <div>{workout.name}</div>;
}
```

✅ **CORRECT - Page with SearchParams**:
```typescript
// app/dashboard/page.tsx

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // ✅ MUST await searchParams
  const params = await searchParams;
  const dateParam = params.date as string | undefined;

  return <div>Date: {dateParam}</div>;
}
```

❌ **NEVER DO THIS**:
```typescript
// app/dashboard/page.tsx

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };  // ❌ WRONG
}) {
  // ❌ WRONG - Not awaited
  const dateParam = searchParams.date as string | undefined;

  return <div>Date: {dateParam}</div>;
}
```

✅ **CORRECT - Page with Both Params and SearchParams**:
```typescript
// app/users/[userId]/posts/page.tsx

type Params = Promise<{ userId: string }>;
type SearchParams = Promise<{ page?: string; sort?: string }>;

export default async function UserPostsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  // ✅ MUST await both
  const { userId } = await params;
  const searchData = await searchParams;

  const page = searchData.page ? parseInt(searchData.page) : 1;
  const sort = searchData.sort || 'recent';

  const posts = await getUserPosts(userId, { page, sort });

  return <div>...</div>;
}
```

### 2. Type Definitions

Always define params and searchParams as Promise types at the top of the file for clarity and reusability.

✅ **CORRECT**:
```typescript
type Params = Promise<{ workoutId: string }>;
type SearchParams = Promise<{ date?: string; filter?: string }>;

export default async function MyPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  // Use the resolved values
}
```

❌ **AVOID - Inline Promise Types**:
```typescript
export default async function MyPage({
  params,
  searchParams,
}: {
  params: Promise<{ workoutId: string }>;  // ❌ Verbose, harder to read
  searchParams: Promise<{ date?: string }>;
}) {
  // ...
}
```

### 3. Dynamic Routes

For dynamic routes with multiple segments, type all params correctly.

✅ **CORRECT - Multi-Segment Dynamic Route**:
```typescript
// app/gyms/[gymId]/workouts/[workoutId]/page.tsx

type Params = Promise<{
  gymId: string;
  workoutId: string;
}>;

export default async function WorkoutDetailPage({
  params,
}: {
  params: Params;
}) {
  const { gymId, workoutId } = await params;

  const workout = await getGymWorkout(gymId, workoutId);

  return <div>...</div>;
}
```

### 4. Catch-All and Optional Catch-All Routes

For catch-all routes, params will include an array.

✅ **CORRECT - Catch-All Route**:
```typescript
// app/docs/[...slug]/page.tsx

type Params = Promise<{
  slug: string[];
}>;

export default async function DocsPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  // slug is an array: ['getting-started', 'installation']
  const content = await getDocContent(slug);

  return <div>...</div>;
}
```

✅ **CORRECT - Optional Catch-All Route**:
```typescript
// app/shop/[[...categories]]/page.tsx

type Params = Promise<{
  categories?: string[];
}>;

export default async function ShopPage({
  params,
}: {
  params: Params;
}) {
  const { categories } = await params;

  // categories might be undefined or an array
  const products = await getProducts(categories);

  return <div>...</div>;
}
```

### 5. Server Component Best Practices

**Server Components are the default** in the App Router. Only use `"use client"` when necessary.

✅ **CORRECT - Data Fetching in Server Component**:
```typescript
import { getWorkouts } from "@/data/workouts";

export default async function WorkoutsPage() {
  // ✅ Fetch data directly in the component
  const workouts = await getWorkouts();

  return (
    <div>
      {workouts.map(workout => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  );
}
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - Unnecessary "use client" directive
"use client";

import { getWorkouts } from "@/data/workouts";

export default async function WorkoutsPage() {
  const workouts = await getWorkouts();  // ❌ Can't use async in client component

  return <div>...</div>;
}
```

### 6. Error Handling with notFound()

Use Next.js's `notFound()` function for missing resources.

✅ **CORRECT**:
```typescript
import { getWorkout } from "@/data/workouts";
import { notFound } from "next/navigation";

type Params = Promise<{ workoutId: string }>;

export default async function WorkoutPage({
  params,
}: {
  params: Params;
}) {
  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  // Validate the ID format
  if (isNaN(workoutIdNum)) {
    notFound();
  }

  const workout = await getWorkout(workoutIdNum);

  // Handle missing resource
  if (!workout) {
    notFound();
  }

  return <div>{workout.name}</div>;
}
```

### 7. Metadata Generation

Metadata functions also receive params as promises.

✅ **CORRECT - generateMetadata**:
```typescript
import { getWorkout } from "@/data/workouts";
import type { Metadata } from "next";

type Params = Promise<{ workoutId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  // ✅ MUST await params in metadata functions too
  const { workoutId } = await params;
  const workout = await getWorkout(parseInt(workoutId, 10));

  return {
    title: workout?.name || "Workout",
    description: `View details for ${workout?.name}`,
  };
}

export default async function WorkoutPage({
  params,
}: {
  params: Params;
}) {
  const { workoutId } = await params;
  // ...
}
```

### 8. Static Site Generation (SSG)

For static generation with dynamic routes, use `generateStaticParams`.

✅ **CORRECT - generateStaticParams**:
```typescript
import { getAllWorkouts } from "@/data/workouts";

type Params = Promise<{ workoutId: string }>;

// Generate static params at build time
export async function generateStaticParams() {
  const workouts = await getAllWorkouts();

  return workouts.map((workout) => ({
    workoutId: workout.id.toString(),
  }));
}

export default async function WorkoutPage({
  params,
}: {
  params: Params;
}) {
  // ✅ Still must await params even in SSG pages
  const { workoutId } = await params;
  const workout = await getWorkout(parseInt(workoutId, 10));

  return <div>{workout.name}</div>;
}
```

## Common Patterns

### Pattern 1: ID Validation and Conversion

```typescript
type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;

  // Convert and validate numeric ID
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }

  const resource = await getResource(numericId);
  if (!resource) {
    notFound();
  }

  return <div>...</div>;
}
```

### Pattern 2: SearchParams with Defaults

```typescript
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Extract with defaults
  const page = params.page ? parseInt(params.page as string) : 1;
  const limit = params.limit ? parseInt(params.limit as string) : 10;
  const sort = (params.sort as string) || 'recent';

  const data = await fetchData({ page, limit, sort });

  return <div>...</div>;
}
```

### Pattern 3: Date Parsing from SearchParams

```typescript
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const dateParam = params.date as string | undefined;

  let date: Date;

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    // Parse YYYY-MM-DD format in local timezone
    const [year, month, day] = dateParam.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date();
  }

  // Validate date
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const data = await getDataForDate(date);

  return <div>...</div>;
}
```

## Migration from Next.js 14

If migrating from Next.js 14, you must update all Server Components that use params or searchParams.

### Before (Next.js 14):
```typescript
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;  // Synchronous access
  // ...
}
```

### After (Next.js 15+):
```typescript
type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;  // Must await
  // ...
}
```

## Checklist

Before creating or modifying a Server Component with dynamic segments, verify:

- [ ] Component function is marked as `async`
- [ ] `params` type is defined as `Promise<{ ... }>`
- [ ] `searchParams` type is defined as `Promise<{ ... }>` (if used)
- [ ] `params` is awaited before accessing properties
- [ ] `searchParams` is awaited before accessing properties
- [ ] Numeric IDs are validated with `isNaN()` check
- [ ] Missing resources are handled with `notFound()`
- [ ] `generateMetadata` also awaits params (if defined)
- [ ] No `"use client"` directive (unless necessary for interactivity)

## Summary

1. **Params Are Promises** - Always type as `Promise<{ ... }>` and await
2. **SearchParams Are Promises** - Always type as `Promise<{ ... }>` and await
3. **Type at Top** - Define Params and SearchParams types at file top
4. **Async Components** - Server Components must be async when using params/searchParams
5. **Validate IDs** - Check for NaN when parsing numeric IDs
6. **Handle Missing Data** - Use `notFound()` for missing resources
7. **Metadata Functions** - Also await params in `generateMetadata`

These patterns are required for all Server Components in this Next.js 16 application.
