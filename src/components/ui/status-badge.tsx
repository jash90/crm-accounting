import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        profit: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        loss: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode
}

export function StatusBadge({ 
  className, 
  variant, 
  size, 
  children, 
  ...props 
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </span>
  )
}

// Convenience components for common statuses
export const SuccessBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="success" {...props} />
)

export const WarningBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="warning" {...props} />
)

export const ErrorBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="error" {...props} />
)

export const InfoBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="info" {...props} />
)

export const ProfitBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="profit" {...props} />
)

export const LossBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="loss" {...props} />
)

export const PendingBadge = (props: Omit<StatusBadgeProps, 'variant'>) => (
  <StatusBadge variant="pending" {...props} />
)