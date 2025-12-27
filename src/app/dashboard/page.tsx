import { getWorkoutsForDate } from "@/data/workouts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateWithOrdinal } from "@/lib/date-utils"
import { CalendarSelector } from "@/components/dashboard/calendar-selector"
import Link from "next/link"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // Get date from URL params or default to today
  const dateParam = params.date as string | undefined
  let date: Date

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    // Parse YYYY-MM-DD format in local timezone
    const [year, month, day] = dateParam.split("-").map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = new Date()
  }

  // Validate date
  if (isNaN(date.getTime())) {
    date = new Date()
  }

  // Fetch workouts for the selected date
  const workouts = await getWorkoutsForDate(date)

  // Calculate workout statistics
  const calculateDuration = (startedAt: Date, completedAt: Date | null) => {
    if (!completedAt) return null

    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()
    const minutes = Math.floor(durationMs / 60000)
    return `${minutes} min`
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your workouts and view your progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <CalendarSelector />
        </div>

        {/* Workouts List Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workouts</CardTitle>
                  <CardDescription>
                    Workouts logged for {formatDateWithOrdinal(date)}
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/dashboard/workout/new">New Workout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {workouts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No workouts logged for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workouts.map((workout) => {
                    const duration = calculateDuration(workout.startedAt, workout.completedAt)
                    const completedTime = workout.completedAt
                      ? formatTime(workout.completedAt)
                      : "In progress"

                    return (
                      <Card key={workout.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">
                                {workout.name || "Untitled Workout"}
                              </CardTitle>
                              <CardDescription>
                                {duration && `${duration} • `}
                                {workout.completedAt
                                  ? `Completed at ${completedTime}`
                                  : "In progress"}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {workout.exercises.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                              No exercises logged
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {workout.exercises.map((exercise, index) => {
                                const totalSets = exercise.sets.length
                                const avgReps =
                                  totalSets > 0
                                    ? Math.round(
                                        exercise.sets.reduce(
                                          (sum, set) => sum + (set.reps || 0),
                                          0
                                        ) / totalSets
                                      )
                                    : 0
                                const maxWeight =
                                  exercise.sets.length > 0
                                    ? Math.max(
                                        ...exercise.sets
                                          .map((set) => parseFloat(set.weight || "0"))
                                          .filter((w) => !isNaN(w))
                                      )
                                    : 0

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">{exercise.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {totalSets} {totalSets === 1 ? "set" : "sets"}
                                        {avgReps > 0 && ` × ${avgReps} reps`}
                                      </p>
                                    </div>
                                    {maxWeight > 0 && (
                                      <div className="text-right">
                                        <p className="font-semibold">{maxWeight} lbs</p>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
