import { getWorkout } from "@/data/workouts";
import { notFound } from "next/navigation";
import { EditWorkoutForm } from "./edit-workout-form";

type Params = Promise<{ workoutId: string }>;

export default async function EditWorkoutPage({
  params,
}: {
  params: Params;
}) {
  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    notFound();
  }

  const workout = await getWorkout(workoutIdNum);

  if (!workout) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Workout</h1>
        <p className="text-muted-foreground mt-2">
          Update your workout details
        </p>
      </div>

      <EditWorkoutForm workout={workout} />
    </div>
  );
}
