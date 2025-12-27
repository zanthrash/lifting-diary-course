"use server";

import { createWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().optional(),
  startedAt: z.string().optional(),
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
