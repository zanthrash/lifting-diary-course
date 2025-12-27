# UI Coding Standards

This document outlines the strict UI coding standards for this project. All developers must adhere to these guidelines without exception.

## Component Library

### shadcn/ui Components - MANDATORY

**CRITICAL RULE**: This project uses **shadcn/ui** components exclusively for all UI elements.

- **ONLY** shadcn/ui components shall be used throughout the entire application
- **ABSOLUTELY NO** custom UI components should be created
- All UI needs must be fulfilled using shadcn/ui components
- If a component is needed, check the [shadcn/ui documentation](https://ui.shadcn.com/) first

### Installation

Install shadcn/ui components as needed:

```bash
npx shadcn@latest add [component-name]
```

### Available Components

Refer to the official shadcn/ui documentation for the complete list of available components:
- Forms: Button, Input, Select, Checkbox, Radio, Switch, Textarea, etc.
- Data Display: Table, Card, Badge, Avatar, Separator, etc.
- Feedback: Alert, Toast, Dialog, Progress, Skeleton, etc.
- Navigation: Tabs, Dropdown Menu, Navigation Menu, etc.
- Layout: Sheet, Drawer, Collapsible, Accordion, etc.

### Component Usage

```tsx
// CORRECT - Using shadcn/ui components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

```tsx
// INCORRECT - Creating custom UI components
// DO NOT DO THIS
export function CustomButton({ children }) {
  return <button className="...">{children}</button>
}
```

## Date Formatting

### Required Library

All date formatting **must** be done using **date-fns**.

```bash
npm install date-fns
```

### Date Format Standard

Dates must be formatted using the following pattern:
- **Ordinal day** + **Abbreviated month** + **Full year**
- Examples:
  - `1st Sep 2025`
  - `2nd Aug 2025`
  - `3rd Jan 2026`
  - `4th Jun 2024`
  - `21st Dec 2025`
  - `22nd Nov 2024`
  - `23rd Mar 2026`

### Implementation

```tsx
import { format } from 'date-fns'

// Function to format dates with ordinal suffix
function formatDateWithOrdinal(date: Date): string {
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

// Usage
const formattedDate = formatDateWithOrdinal(new Date('2025-09-01'))
// Output: "1st Sep 2025"
```

### Date Display Components

When displaying dates in the UI, always use shadcn/ui components combined with date-fns formatting:

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { formatDateWithOrdinal } from "@/lib/date-utils"

export function DateDisplay({ date }: { date: Date }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {formatDateWithOrdinal(date)}
        </p>
      </CardContent>
    </Card>
  )
}
```

## Styling

### Tailwind CSS

- Use Tailwind CSS utility classes for styling
- Follow shadcn/ui's design system tokens
- Leverage CSS variables defined by shadcn/ui for theming

### Dark Mode

- shadcn/ui components support dark mode out of the box
- Use the theme provider from shadcn/ui for dark mode implementation

## Summary

1. **ONLY** use shadcn/ui components for all UI elements
2. **NEVER** create custom UI components
3. Use **date-fns** for all date formatting
4. Format dates as: `1st Sep 2025`, `2nd Aug 2025`, etc.
5. Leverage Tailwind CSS for styling
6. Follow shadcn/ui design system conventions

## Questions?

If you need a UI element that doesn't seem to exist in shadcn/ui:
1. Check the [shadcn/ui documentation](https://ui.shadcn.com/) thoroughly
2. Consider combining existing shadcn/ui components
3. Check if shadcn/ui has recently added new components
4. Consult with the team before considering alternatives

**Remember**: No custom UI components. shadcn/ui only.
