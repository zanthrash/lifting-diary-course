import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Exercises table - stores both predefined and user-created exercises
export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"), // null for predefined, Clerk userId for custom
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("exercises_user_id_idx").on(table.userId),
    nameUserIdUnique: unique("exercises_name_user_id_unique").on(
      table.name,
      table.userId
    ),
  })
);

// Workouts table - stores workout sessions
export const workouts = pgTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("workouts_user_id_idx").on(table.userId),
    startedAtIdx: index("workouts_started_at_idx").on(table.startedAt),
  })
);

// Workout Exercises table - junction table linking workouts to exercises
export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    workoutIdOrderIdx: index("workout_exercises_workout_id_order_idx").on(
      table.workoutId,
      table.order
    ),
    exerciseIdIdx: index("workout_exercises_exercise_id_idx").on(
      table.exerciseId
    ),
  })
);

// Sets table - stores individual sets for each exercise in a workout
export const sets = pgTable(
  "sets",
  {
    id: serial("id").primaryKey(),
    workoutExerciseId: integer("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    weight: numeric("weight", { precision: 10, scale: 2 }),
    reps: integer("reps"),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    workoutExerciseIdSetNumberIdx: index(
      "sets_workout_exercise_id_set_number_idx"
    ).on(table.workoutExerciseId, table.setNumber),
    weightCheck: check("sets_weight_check", sql`${table.weight} > 0`),
    repsCheck: check("sets_reps_check", sql`${table.reps} > 0`),
    durationCheck: check(
      "sets_duration_check",
      sql`${table.durationSeconds} > 0`
    ),
  })
);
