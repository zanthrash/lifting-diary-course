# Data Mutations

**CRITICAL**: This document outlines the ONLY acceptable patterns for data mutations in this application. Deviations from these patterns are not permitted.

## Core Principles

### 1. Server Actions Only

**ALL data mutations MUST be done via Server Actions in colocated `actions.ts` files.**

✅ **CORRECT**:
```typescript
// app/workouts/actions.ts
"use server";

import { createWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  notes: z.string().optional(),
});

export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  const validated = createWorkoutSchema.parse(input);

  const workout = await createWorkout(validated);

  revalidatePath("/workouts");
  return { success: true, workout };
}
```

❌ **NEVER DO THIS**:
```typescript
// Using Route Handlers for mutations
// app/api/workouts/route.ts
// ❌ WRONG - Do not use route handlers for mutations
export async function POST(request: Request) {
  const body = await request.json();
  const workout = await db.insert(workouts).values(body);
  return Response.json(workout);
}
```

❌ **NEVER DO THIS**:
```typescript
// Direct database mutations in components
// app/workouts/page.tsx
// ❌ WRONG - No direct DB access in components
export default async function WorkoutsPage() {
  async function handleCreate() {
    "use server";
    await db.insert(workouts).values({ name: "New Workout" }); // ❌ WRONG
  }

  return <form action={handleCreate}>...</form>;
}
```

### 2. Data Directory Pattern

**ALL database mutations MUST be implemented in helper functions within the `/data` directory.**

The `/data` directory contains all data access layer functions that interact with the database. Server actions call these helpers.

✅ **CORRECT Structure**:
```
src/
  data/
    workouts.ts      # Workout CRUD operations
    exercises.ts     # Exercise CRUD operations
    users.ts         # User CRUD operations
  app/
    workouts/
      actions.ts     # Server actions that call data helpers
      page.tsx       # Server Component
```

✅ **CORRECT Implementation**:
```typescript
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function createWorkout(data: {
  name: string;
  date: string;
  notes?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      ...data,
      userId,
    })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: string,
  data: {
    name?: string;
    date?: string;
    notes?: string;
  }
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)  // ✅ User isolation enforced
    ))
    .returning();

  if (!updated) {
    throw new Error("Workout not found");
  }

  return updated;
}

export async function deleteWorkout(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [deleted] = await db
    .delete(workouts)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)  // ✅ User isolation enforced
    ))
    .returning();

  if (!deleted) {
    throw new Error("Workout not found");
  }

  return deleted;
}
```

### 3. Server Actions with Zod Validation

**ALL server actions MUST validate input using Zod schemas. Parameters MUST be typed (never use FormData type).**

✅ **CORRECT**:
```typescript
// app/workouts/actions.ts
"use server";

import { createWorkout, updateWorkout, deleteWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string(),
  notes: z.string().optional(),
});

const updateWorkoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.string(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  // Validate input
  const validated = createWorkoutSchema.parse(input);

  // Call data layer helper
  const workout = await createWorkout(validated);

  // Revalidate cache
  revalidatePath("/workouts");

  return { success: true, workout };
}

export async function updateWorkoutAction(
  input: z.infer<typeof updateWorkoutSchema>
) {
  const validated = updateWorkoutSchema.parse(input);

  const { id, ...data } = validated;
  const workout = await updateWorkout(id, data);

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${id}`);

  return { success: true, workout };
}

export async function deleteWorkoutAction(
  input: z.infer<typeof deleteWorkoutSchema>
) {
  const validated = deleteWorkoutSchema.parse(input);

  await deleteWorkout(validated.id);

  revalidatePath("/workouts");

  return { success: true };
}
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - Using FormData type
"use server";

export async function createWorkoutAction(formData: FormData) {  // ❌ WRONG
  const name = formData.get("name");  // ❌ No validation
  await createWorkout({ name });  // ❌ Unvalidated data
}
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - No Zod validation
"use server";

export async function createWorkoutAction(input: { name: string }) {
  // ❌ WRONG - No validation!
  await createWorkout(input);
}
```

### 4. Drizzle ORM Only

**ALL database mutations MUST use Drizzle ORM. Raw SQL is NOT permitted.**

✅ **CORRECT**:
```typescript
import { db } from "@/db";
import { workouts } from "@/db/schema";

// INSERT
const [workout] = await db
  .insert(workouts)
  .values({ name: "Leg Day", userId })
  .returning();

// UPDATE
const [updated] = await db
  .update(workouts)
  .set({ name: "Upper Body Day" })
  .where(eq(workouts.id, workoutId))
  .returning();

// DELETE
const [deleted] = await db
  .delete(workouts)
  .where(eq(workouts.id, workoutId))
  .returning();
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - No raw SQL
await db.execute(`
  INSERT INTO workouts (name, user_id) VALUES ('${name}', '${userId}')
`);
```

### 5. User Data Isolation

**CRITICAL**: Logged-in users can ONLY mutate their own data. Every mutation MUST enforce user isolation.

✅ **CORRECT - Always filter by userId**:
```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function updateWorkout(workoutId: string, data: { name: string }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // CRITICAL: Always filter by userId
  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)  // ✅ User isolation enforced
    ))
    .returning();

  if (!updated) {
    throw new Error("Workout not found");
  }

  return updated;
}
```

❌ **NEVER DO THIS**:
```typescript
// ❌ WRONG - Missing userId filter
export async function updateWorkout(workoutId: string, data: { name: string }) {
  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(eq(workouts.id, workoutId))  // ❌ No user isolation!
    .returning();

  return updated;
}
```

### 6. Client-Side Redirects Only

**CRITICAL**: Server actions MUST NOT use the `redirect()` function. All redirects MUST be handled client-side after the server action resolves.

✅ **CORRECT - Client-side redirect**:
```typescript
// app/workouts/actions.ts
"use server";

import { createWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  const validated = createWorkoutSchema.parse(input);
  const workout = await createWorkout(validated);

  revalidatePath("/workouts");

  // ✅ Return success response, let client handle redirect
  return { success: true, workout };
}
```

```typescript
// app/workouts/create-workout-form.tsx
"use client";

import { createWorkoutAction } from "./actions";
import { useRouter } from "next/navigation";

export function CreateWorkoutForm() {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await createWorkoutAction({ name: "Leg Day" });

    // ✅ Handle redirect on client side
    if (result.success) {
      router.push("/workouts");
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

❌ **NEVER DO THIS**:
```typescript
// app/workouts/actions.ts
"use server";

import { redirect } from "next/navigation";  // ❌ WRONG

export async function createWorkoutAction(input: { name: string }) {
  const workout = await createWorkout(input);

  revalidatePath("/workouts");

  // ❌ WRONG - Do not redirect in server action
  redirect("/workouts");
}
```

**Why?**
- Server actions should focus on data mutations and validation
- Redirects in server actions can cause unexpected behavior and make error handling difficult
- Client-side redirects provide better control over the user experience
- Allows for proper loading states and error handling before navigation

## Complete Example

### Data Layer (`src/data/workouts.ts`)
```typescript
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function createWorkout(data: {
  name: string;
  date: string;
  notes?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      ...data,
      userId,
    })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: string,
  data: {
    name?: string;
    date?: string;
    notes?: string;
  }
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ))
    .returning();

  if (!updated) {
    throw new Error("Workout not found");
  }

  return updated;
}

export async function deleteWorkout(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [deleted] = await db
    .delete(workouts)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ))
    .returning();

  if (!deleted) {
    throw new Error("Workout not found");
  }

  return deleted;
}
```

### Server Actions (`src/app/workouts/actions.ts`)
```typescript
"use server";

import { createWorkout, updateWorkout, deleteWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string(),
  notes: z.string().optional(),
});

const updateWorkoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.string(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  const validated = createWorkoutSchema.parse(input);
  const workout = await createWorkout(validated);

  revalidatePath("/workouts");

  return { success: true, workout };
}

export async function updateWorkoutAction(
  input: z.infer<typeof updateWorkoutSchema>
) {
  const validated = updateWorkoutSchema.parse(input);
  const { id, ...data } = validated;

  const workout = await updateWorkout(id, data);

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${id}`);

  return { success: true, workout };
}

export async function deleteWorkoutAction(
  input: z.infer<typeof deleteWorkoutSchema>
) {
  const validated = deleteWorkoutSchema.parse(input);
  await deleteWorkout(validated.id);

  revalidatePath("/workouts");

  return { success: true };
}
```

### Client Component Usage (`src/app/workouts/create-workout-form.tsx`)
```typescript
"use client";

import { createWorkoutAction } from "./actions";
import { useState } from "react";

export function CreateWorkoutForm() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const result = await createWorkoutAction({
        name,
        date,
        notes,
      });

      if (result.success) {
        // Reset form or show success message
        setName("");
        setDate("");
        setNotes("");
      }
    } catch (error) {
      // Handle validation or mutation errors
      console.error(error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workout name"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
      />
      <button type="submit">Create Workout</button>
    </form>
  );
}
```

## Prohibited Patterns

### ❌ Route Handlers for Mutations
```typescript
// app/api/workouts/route.ts
// ❌ WRONG - Do not use route handlers for mutations
export async function POST(request: Request) {
  const body = await request.json();
  const workout = await db.insert(workouts).values(body);
  return Response.json(workout);
}
```

### ❌ FormData Parameters
```typescript
// app/workouts/actions.ts
"use server";

// ❌ WRONG - No FormData parameters
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name");
  await createWorkout({ name });
}
```

### ❌ Missing Zod Validation
```typescript
// app/workouts/actions.ts
"use server";

// ❌ WRONG - Must validate with Zod
export async function createWorkoutAction(input: { name: string }) {
  await createWorkout(input);  // ❌ No validation!
}
```

### ❌ Direct Database Access in Actions
```typescript
// app/workouts/actions.ts
"use server";

import { db } from "@/db";
import { workouts } from "@/db/schema";

// ❌ WRONG - Must use data layer helpers
export async function createWorkoutAction(input: { name: string }) {
  const validated = createWorkoutSchema.parse(input);

  // ❌ WRONG - Direct DB access in server action
  await db.insert(workouts).values(validated);
}
```

### ❌ Missing User Isolation
```typescript
// src/data/workouts.ts
// ❌ WRONG - Every mutation must enforce user isolation
export async function deleteWorkout(workoutId: string) {
  await db
    .delete(workouts)
    .where(eq(workouts.id, workoutId));  // ❌ No userId filter!
}
```

### ❌ Server-Side Redirects
```typescript
// app/workouts/actions.ts
"use server";

import { redirect } from "next/navigation";

// ❌ WRONG - Do not use redirect() in server actions
export async function createWorkoutAction(input: { name: string }) {
  const validated = createWorkoutSchema.parse(input);
  const workout = await createWorkout(validated);

  revalidatePath("/workouts");

  // ❌ WRONG - Redirect should be handled client-side
  redirect("/workouts");
}
```

## Error Handling

Server actions should handle errors gracefully and return structured responses:

✅ **CORRECT**:
```typescript
"use server";

import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  try {
    const validated = createWorkoutSchema.parse(input);
    const workout = await createWorkout(validated);

    revalidatePath("/workouts");

    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## Security Checklist

Before implementing any data mutation feature, verify:

- [ ] Server action is in colocated `actions.ts` file
- [ ] Server action has `"use server"` directive
- [ ] Server action parameters are typed (not FormData)
- [ ] Server action validates input with Zod schema
- [ ] Data helper function is in `/data` directory
- [ ] Data helper uses Drizzle ORM (no raw SQL)
- [ ] Data helper calls `auth()` to get `userId`
- [ ] Data helper throws error if `userId` is null
- [ ] Mutation filters by `userId` (user isolation enforced)
- [ ] Server action calls `revalidatePath()` after mutation
- [ ] Server action returns structured response
- [ ] Server action does NOT use `redirect()` - redirects are handled client-side

## Summary

1. **Server Actions Only** - All mutations happen via server actions in `actions.ts`
2. **Typed Parameters** - Never use FormData, always use typed objects
3. **Zod Validation** - Every server action must validate input with Zod
4. **Data Directory** - All database mutations in `/data` helper functions
5. **Drizzle ORM** - Use Drizzle, never raw SQL
6. **User Isolation** - Always filter by `userId` to prevent unauthorized access
7. **Client-Side Redirects** - Never use `redirect()` in server actions; handle redirects client-side

These patterns are non-negotiable and must be followed in every data mutation scenario.
