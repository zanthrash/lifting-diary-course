"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateWithOrdinal } from "@/lib/date-utils"

export function CalendarSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get date from URL or default to today
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get("date")
    if (dateParam) {
      const date = new Date(dateParam)
      return isNaN(date.getTime()) ? new Date() : date
    }
    return new Date()
  })

  // Update URL when date changes
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)

    // Format date as YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateString = `${year}-${month}-${day}`

    // Update URL with new date
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", dateString)
    router.push(`?${params.toString()}`)
  }

  return (
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
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  )
}
