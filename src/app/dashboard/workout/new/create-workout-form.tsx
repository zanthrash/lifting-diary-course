"use client";

import { createWorkoutAction } from "../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export function CreateWorkoutForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startedAt, setStartedAt] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createWorkoutAction({
        name: name || undefined,
        startedAt,
      });

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to create workout");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workout");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Workout</CardTitle>
        <CardDescription>
          Start a new workout session
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

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Workout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
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
