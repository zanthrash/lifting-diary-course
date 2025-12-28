import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export type WorkoutSet = {
  setNumber: number;
  weight: string | null;
  reps: number | null;
  durationSeconds: number | null;
};

export type WorkoutExercise = {
  name: string;
  sets: WorkoutSet[];
};

export type WorkoutWithExercises = {
  id: number;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  exercises: WorkoutExercise[];
};

export async function getWorkoutsForDate(date: Date): Promise<WorkoutWithExercises[]> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Set the start and end of the selected date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch workouts for the selected date with exercises and sets
  const workoutsData = await db
    .select({
      workout: workouts,
      workoutExercise: workoutExercises,
      exercise: exercises,
      set: sets,
    })
    .from(workouts)
    .leftJoin(
      workoutExercises,
      eq(workoutExercises.workoutId, workouts.id)
    )
    .leftJoin(
      exercises,
      eq(exercises.id, workoutExercises.exerciseId)
    )
    .leftJoin(
      sets,
      eq(sets.workoutExerciseId, workoutExercises.id)
    )
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, startOfDay),
        lt(workouts.startedAt, endOfDay)
      )
    )
    .orderBy(desc(workouts.startedAt));

  // Transform the flat result into a nested structure
  type WorkoutWithExerciseMap = {
    id: number;
    name: string | null;
    startedAt: Date;
    completedAt: Date | null;
    exercises: Map<number, {
      name: string;
      order: number;
      sets: WorkoutSet[];
    }>;
  };

  const workoutsMap = new Map<number, WorkoutWithExerciseMap>();

  for (const row of workoutsData) {
    if (!row.workout) continue;

    const workoutId = row.workout.id;

    if (!workoutsMap.has(workoutId)) {
      workoutsMap.set(workoutId, {
        id: row.workout.id,
        name: row.workout.name,
        startedAt: row.workout.startedAt,
        completedAt: row.workout.completedAt,
        exercises: new Map(),
      });
    }

    const workout = workoutsMap.get(workoutId);
    if (!workout) continue;

    if (row.exercise && row.workoutExercise) {
      const exerciseId = row.exercise.id;

      if (!workout.exercises.has(exerciseId)) {
        workout.exercises.set(exerciseId, {
          name: row.exercise.name,
          order: row.workoutExercise.order,
          sets: [],
        });
      }

      if (row.set) {
        const exercise = workout.exercises.get(exerciseId);
        if (exercise) {
          exercise.sets.push({
            setNumber: row.set.setNumber,
            weight: row.set.weight,
            reps: row.set.reps,
            durationSeconds: row.set.durationSeconds,
          });
        }
      }
    }
  }

  // Convert maps to arrays and sort
  return Array.from(workoutsMap.values()).map((workout) => ({
    ...workout,
    exercises: Array.from(workout.exercises.values())
      .sort((a, b) => a.order - b.order)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ order, ...exercise }) => ({
        ...exercise,
        sets: exercise.sets.sort((a, b) => a.setNumber - b.setNumber),
      })),
  }));
}

export async function getAllWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt));
}

export async function getWorkout(workoutId: number) {
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

export async function createWorkout(data: {
  name?: string;
  startedAt?: Date;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      name: data.name || null,
      startedAt: data.startedAt || new Date(),
      userId,
    })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: number,
  data: {
    name?: string | null;
    startedAt?: Date;
    completedAt?: Date | null;
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
