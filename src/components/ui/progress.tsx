// src/components/ui/progress.tsx - Versión simplificada sin dependencias
"use client"

import * as React from "react"

// Función simple para combinar clases
const combineClasses = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={combineClasses(
          "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }