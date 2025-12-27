# Data Fetching

**CRITICAL**: This document outlines the ONLY acceptable patterns for data fetching in this application. Deviations from these patterns are not permitted.

## Core Principles

### 1. Server Components Only

**ALL data fetching MUST be done via Server Components.**

✅ **CORRECT**:
```typescript
// app/dashboard/page.tsx
import { getWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
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
// Using Route Handlers
"use client";
export default function DashboardPage() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch('/api/workouts')  // ❌ WRONG
      .then(res => res.json())
      .then(setWorkouts);
  }, []);

  return <div>...</div>;
}
```

❌ **NEVER DO THIS**:
```typescript
// Fetching directly in client components
"use client";
export default function DashboardPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // ❌ WRONG - No data fetching in client components
    fetchData().then(setData);
  }, []);
}
```

### 2. Data Directory Pattern

**ALL database queries MUST be implemented in helper functions within the `/data` directory.**

The `/data` directory contains all data access layer functions that interact with the database.

✅ **CORRECT Structure**:
```
src/
  data/
    workouts.ts      # Workout-related queries
    exercises.ts     # Exercise-related queries
    users.ts         # User-related queries
  app/
    dashboard/
      page.tsx       # Server Component that calls data functions
```

✅ **CORRECT Implementation**:
```typescript
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}
```

### 3. Drizzle ORM Only

**ALL database queries MUST use Drizzle ORM. Raw SQL is NOT permitted.**

✅ **CORRECT**:
```typescript
import { db } from "@/db";
import { workouts, exercises } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getWorkoutWithExercises(workoutId: string, userId: string) {
  return await db
    .select()
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ))
    .orderBy(desc(workouts.createdAt));
}
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - No raw SQL
export async function getWorkouts(userId: string) {
  return await db.execute(`
    SELECT * FROM workouts WHERE user_id = ${userId}
  `);
}
```

### 4. User Data Isolation

**CRITICAL**: Logged-in users can ONLY access their own data. Every data function MUST enforce user isolation.

✅ **CORRECT - Always filter by userId**:
```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getWorkout(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // CRITICAL: Always filter by userId
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)  // ✅ User isolation enforced
    ))
    .limit(1);

  return workout;
}
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - Missing userId filter
export async function getWorkout(workoutId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))  // ❌ No user isolation!
    .limit(1);

  return workout;
}
```

## Complete Example

### Data Layer (`src/data/workouts.ts`)
```typescript
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function getWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

export async function getWorkout(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ))
    .limit(1);

  return workout;
}
```

### Server Component (`src/app/dashboard/page.tsx`)
```typescript
import { getWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const workouts = await getWorkouts();

  return (
    <div>
      <h1>My Workouts</h1>
      {workouts.map(workout => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  );
}
```

## Prohibited Patterns

### ❌ Route Handlers for Data Fetching
```typescript
// app/api/workouts/route.ts
// ❌ WRONG - Do not create route handlers for data fetching
export async function GET() {
  const workouts = await db.select().from(workouts);
  return Response.json(workouts);
}
```

### ❌ Client-Side Data Fetching
```typescript
"use client";
// ❌ WRONG - No data fetching in client components
export default function MyComponent() {
  useEffect(() => {
    fetchData();  // ❌ WRONG
  }, []);
}
```

### ❌ Missing User Isolation
```typescript
// ❌ WRONG - Every query must filter by userId
export async function getWorkouts() {
  return await db.select().from(workouts);  // ❌ No userId filter!
}
```

### ❌ Raw SQL Queries
```typescript
// ❌ WRONG - Use Drizzle ORM, not raw SQL
export async function getWorkouts(userId: string) {
  return await db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`);
}
```

## Security Checklist

Before implementing any data fetching feature, verify:

- [ ] Data function is in `/data` directory
- [ ] Function uses Drizzle ORM (no raw SQL)
- [ ] Function calls `auth()` to get `userId`
- [ ] Function throws error if `userId` is null
- [ ] Query filters by `userId` (user isolation enforced)
- [ ] Server Component (not client component) calls the data function
- [ ] No route handlers are used for data fetching

## Summary

1. **Server Components Only** - All data fetching happens in Server Components
2. **Data Directory** - All database queries in `/data` helper functions
3. **Drizzle ORM** - Use Drizzle, never raw SQL
4. **User Isolation** - Always filter by `userId` to prevent unauthorized access

These patterns are non-negotiable and must be followed in every data access scenario.
