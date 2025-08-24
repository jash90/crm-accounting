import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardHeader, CardContent } from "./card"

interface FinanceCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  icon?: React.ReactNode
  description?: string
}

export function FinanceCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  className,
  icon,
  description
}: FinanceCardProps) {
  const trendColors = {
    up: 'text-profit',
    down: 'text-loss',
    neutral: 'text-neutral'
  }
  
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus
  }[trend]

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN'
      }).format(val)
    }
    return val
  }

  return (
    <Card className={cn("p-6", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <TrendIcon className={cn("h-4 w-4", trendColors[trend])} />
      </CardHeader>
      <CardContent className="p-0">
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-foreground">
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <p className={cn("ml-2 text-sm font-medium", trendColors[trend])}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </p>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}