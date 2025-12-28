"use client";

import { updateWorkoutAction } from "../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

type Workout = {
  id: number;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  userId: string;
  createdAt: Date;
};

export function EditWorkoutForm({ workout }: { workout: Workout }) {
  const router = useRouter();
  const [name, setName] = useState(workout.name || "");
  const [startedAt, setStartedAt] = useState(
    format(new Date(workout.startedAt), "yyyy-MM-dd'T'HH:mm")
  );
  const [completedAt, setCompletedAt] = useState(
    workout.completedAt
      ? format(new Date(workout.completedAt), "yyyy-MM-dd'T'HH:mm")
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateWorkoutAction({
        id: workout.id,
        name: name || null,
        startedAt,
        completedAt: completedAt || null,
      });

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to update workout");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workout");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Workout</CardTitle>
        <CardDescription>
          Update your workout details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Leg Day, Upper Body, etc."
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              Leave blank for unnamed workout
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startedAt">Started At</Label>
            <Input
              id="startedAt"
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              When did you start this workout?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completedAt">Completed At (Optional)</Label>
            <Input
              id="completedAt"
              type="datetime-local"
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              When did you complete this workout? Leave blank if still in progress
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Workout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
