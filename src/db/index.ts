import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });

// Export schema for use in the app
export { exercises, workouts, workoutExercises, sets } from "./schema";
