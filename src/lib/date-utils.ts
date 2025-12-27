import { format } from 'date-fns'

/**
 * Formats a date with ordinal suffix in the format: "1st Sep 2025"
 * @param date - The date to format
 * @returns Formatted date string with ordinal day, abbreviated month, and full year
 */
export function formatDateWithOrdinal(date: Date): string {
  const day = format(date, 'd')
  const month = format(date, 'MMM')
  const year = format(date, 'yyyy')

  const suffix = (day: string) => {
    const num = parseInt(day)
    if (num > 3 && num < 21) return 'th'
    switch (num % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  return `${day}${suffix(day)} ${month} ${year}`
}
