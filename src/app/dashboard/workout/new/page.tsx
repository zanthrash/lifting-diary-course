import { CreateWorkoutForm } from "./create-workout-form";

export default function NewWorkoutPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Workout</h1>
        <p className="text-muted-foreground mt-2">
          Create a new workout session to track your exercises
        </p>
      </div>

      <CreateWorkoutForm />
    </div>
  );
}
