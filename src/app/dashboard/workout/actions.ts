"use server";

import { createWorkout, updateWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().optional(),
  startedAt: z.string().optional(),
});

const updateWorkoutSchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  try {
    const validated = createWorkoutSchema.parse(input);

    // Convert startedAt string to Date if provided
    const startedAt = validated.startedAt
      ? new Date(validated.startedAt)
      : new Date();

    const workout = await createWorkout({
      name: validated.name,
      startedAt,
    });

    revalidatePath("/dashboard");

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

export async function updateWorkoutAction(
  input: z.infer<typeof updateWorkoutSchema>
) {
  try {
    const validated = updateWorkoutSchema.parse(input);
    const { id, ...data } = validated;

    // Convert date strings to Date objects if provided
    const updateData: {
      name?: string | null;
      startedAt?: Date;
      completedAt?: Date | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.startedAt) {
      updateData.startedAt = new Date(data.startedAt);
    }

    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }

    const workout = await updateWorkout(id, updateData);

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${id}`);

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
