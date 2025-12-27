"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateWithOrdinal } from "@/lib/date-utils"

// Mock workout data for UI purposes only
const mockWorkouts = [
  {
    id: 1,
    name: "Morning Upper Body",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, weight: "185 lbs" },
      { name: "Shoulder Press", sets: 3, reps: 10, weight: "95 lbs" },
      { name: "Pull-ups", sets: 3, reps: 12, weight: "Bodyweight" },
    ],
    duration: "45 min",
    completedAt: "8:30 AM"
  },
  {
    id: 2,
    name: "Evening Leg Day",
    exercises: [
      { name: "Squats", sets: 5, reps: 5, weight: "225 lbs" },
      { name: "Romanian Deadlifts", sets: 3, reps: 10, weight: "185 lbs" },
      { name: "Leg Press", sets: 3, reps: 12, weight: "320 lbs" },
    ],
    duration: "60 min",
    completedAt: "6:00 PM"
  }
]

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                {formatDateWithOrdinal(selectedDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Workouts List Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Workouts</CardTitle>
              <CardDescription>
                Workouts logged for {formatDateWithOrdinal(selectedDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockWorkouts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No workouts logged for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockWorkouts.map((workout) => (
                    <Card key={workout.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{workout.name}</CardTitle>
                            <CardDescription>
                              {workout.duration} • Completed at {workout.completedAt}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {workout.exercises.map((exercise, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{exercise.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} reps
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{exercise.weight}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
