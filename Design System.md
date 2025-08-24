
# Accounting CRM Design System

## Tailwind CSS & shadcn/ui Implementation Guide

### Table of Contents

1.  [Design Principles](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#design-principles)
2.  [Color System](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#color-system)
3.  [Typography](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#typography)
4.  [Spacing & Layout](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#spacing--layout)
5.  [Component Library](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#component-library)
6.  [Tailwind Configuration](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#tailwind-configuration)
7.  [shadcn/ui Integration](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#shadcnui-integration)
8.  [Implementation Guidelines](https://claude.ai/chat/7f9f0067-cf18-45c9-8088-9bd09c0c53f3#implementation-guidelines)

----------

## Design Principles

### Core Values

-   **Clarity First**: Financial data must be immediately understandable
-   **Professional Trust**: Convey reliability and security through design
-   **Efficiency**: Minimize cognitive load for repetitive tasks
-   **Accessibility**: WCAG 2.1 AA compliance for inclusive design
-   **Consistency**: Predictable patterns across all modules

### Visual Language

-   **Clean & Minimal**: Reduce visual noise to highlight data
-   **Hierarchical**: Clear information hierarchy for complex screens
-   **Responsive**: Mobile-first approach with desktop optimization
-   **Contextual**: Adaptive UI based on user role and task

----------

## Color System

### Primary Palette - Forest Green

```css
/* Primary - Dark Green */
--primary-50: #f0fdf4;   /* Lightest tint */
--primary-100: #dcfce7;
--primary-200: #bbf7d0;
--primary-300: #86efac;
--primary-400: #4ade80;
--primary-500: #22c55e;  /* Base for light elements */
--primary-600: #16a34a;  /* Main Primary */
--primary-700: #15803d;  /* Default Primary - Forest Green */
--primary-800: #166534;
--primary-900: #14532d;  /* Darkest shade */
--primary-950: #052e16;

```

### Semantic Colors

```css
/* Status Colors */
--success: #10b981;      /* Emerald-500 - Positive actions */
--warning: #f59e0b;      /* Amber-500 - Alerts */
--error: #ef4444;        /* Red-500 - Errors */
--info: #3b82f6;         /* Blue-500 - Information */

/* Financial Indicators */
--profit: #10b981;       /* Green for positive values */
--loss: #ef4444;         /* Red for negative values */
--neutral: #6b7280;      /* Gray for zero/neutral */
--pending: #f59e0b;      /* Amber for pending items */

```

### Neutral Palette

```css
/* Grays - Slate scale for better green compatibility */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
--gray-950: #020617;

```

### Surface Colors

```css
/* Backgrounds */
--background: #ffffff;
--background-secondary: #f8fafc;
--background-tertiary: #f1f5f9;

/* Dark mode */
--background-dark: #0f172a;
--background-secondary-dark: #1e293b;
--background-tertiary-dark: #334155;

```

----------

## Typography

### Font Stack

```css
/* Primary Font - System Font Stack for performance */
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Monospace for numbers/codes */
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, 
             "Liberation Mono", Menlo, monospace;

```

### Type Scale

```css
/* Tailwind Classes */
text-xs:   0.75rem;  /* 12px - Captions, labels */
text-sm:   0.875rem; /* 14px - Secondary text */
text-base: 1rem;     /* 16px - Body text */
text-lg:   1.125rem; /* 18px - Emphasized body */
text-xl:   1.25rem;  /* 20px - Small headings */
text-2xl:  1.5rem;   /* 24px - Section headings */
text-3xl:  1.875rem; /* 30px - Page headings */
text-4xl:  2.25rem;  /* 36px - Large headings */
text-5xl:  3rem;     /* 48px - Hero text */

```

### Font Weights

```css
font-normal: 400;  /* Body text */
font-medium: 500;  /* Emphasized text */
font-semibold: 600; /* Subheadings */
font-bold: 700;    /* Headings */

```

### Line Heights

```css
leading-none: 1;      /* Display text */
leading-tight: 1.25;  /* Headings */
leading-snug: 1.375;  /* Subheadings */
leading-normal: 1.5;  /* Body text */
leading-relaxed: 1.625; /* Long-form content */

```

----------

## Spacing & Layout

### Spacing Scale

```css
/* Tailwind spacing units (1 unit = 0.25rem = 4px) */
space-0: 0;
space-1: 0.25rem;  /* 4px */
space-2: 0.5rem;   /* 8px */
space-3: 0.75rem;  /* 12px */
space-4: 1rem;     /* 16px */
space-5: 1.25rem;  /* 20px */
space-6: 1.5rem;   /* 24px */
space-8: 2rem;     /* 32px */
space-10: 2.5rem;  /* 40px */
space-12: 3rem;    /* 48px */
space-16: 4rem;    /* 64px */

```

### Container Widths

```css
/* Max widths for different contexts */
max-w-xs: 20rem;    /* 320px - Modals */
max-w-sm: 24rem;    /* 384px - Sidebars */
max-w-md: 28rem;    /* 448px - Forms */
max-w-lg: 32rem;    /* 512px - Cards */
max-w-xl: 36rem;    /* 576px - Content */
max-w-2xl: 42rem;   /* 672px - Articles */
max-w-7xl: 80rem;   /* 1280px - Main container */

```

### Grid System

```css
/* 12-column grid for complex layouts */
grid-cols-12
gap-4  /* Default gap between grid items */

/* Responsive breakpoints */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

```

----------

## Component Library

### Buttons

#### Primary Button

```jsx
className="inline-flex items-center justify-center rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

```

#### Secondary Button

```jsx
className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

```

#### Ghost Button

```jsx
className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"

```

### Cards

#### Base Card

```jsx
className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"

```

#### Interactive Card

```jsx
className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"

```

#### Dashboard Widget

```jsx
className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"

```

### Forms

#### Input Field

```jsx
className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"

```

#### Label

```jsx
className="block text-sm font-medium text-gray-700 mb-1"

```

#### Error Text

```jsx
className="mt-1 text-sm text-red-600"

```

#### Helper Text

```jsx
className="mt-1 text-sm text-gray-500"

```

### Tables

#### Table Container

```jsx
className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg"

```

#### Table Header

```jsx
className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"

```

#### Table Cell

```jsx
className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"

```

### Badges

#### Status Badges

```jsx
// Success
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"

// Warning
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"

// Error
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"

// Info
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"

```

### Navigation

#### Sidebar Item

```jsx
// Default
className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"

// Active
className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-primary-50 text-primary-700"

```

#### Tab

```jsx
// Default
className="px-3 py-2 font-medium text-sm rounded-md text-gray-500 hover:text-gray-700"

// Active
className="px-3 py-2 font-medium text-sm rounded-md bg-primary-100 text-primary-700"

```

----------

## Tailwind Configuration

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#15803d",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#f0fdf4",
          foreground: "#15803d",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Financial indicators
        profit: "#10b981",
        loss: "#ef4444",
        pending: "#f59e0b",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

```

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    
    --primary: 142 71% 29%; /* Forest green */
    --primary-foreground: 0 0% 100%;
    
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    --accent: 142 71% 96%;
    --accent-foreground: 142 71% 29%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142 71% 29%;
    
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    
    --primary: 142 71% 45%;
    --primary-foreground: 222.2 47.4% 11.2%;
    
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 142 71% 45%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

----------

## shadcn/ui Integration

### Installation & Setup

```bash
# Install shadcn/ui
npx shadcn-ui@latest init

# Configure components.json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}

```

### Custom shadcn/ui Components

#### Custom Button Variant

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-700 text-primary-foreground hover:bg-primary-800",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-profit text-white hover:bg-profit/90",
        warning: "bg-pending text-white hover:bg-pending/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

```

#### Financial Data Card

```tsx
// components/ui/finance-card.tsx
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface FinanceCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function FinanceCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  className 
}: FinanceCardProps) {
  const trendColors = {
    up: 'text-profit',
    down: 'text-loss',
    neutral: 'text-muted-foreground'
  }
  
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus
  }[trend]

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-6 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <TrendIcon className={cn("h-4 w-4", trendColors[trend])} />
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={cn("ml-2 text-sm", trendColors[trend])}>
            {change > 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
    </div>
  )
}

```

----------

## Implementation Guidelines

### Component Structure

```tsx
// Recommended component structure
components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── layout/               # Layout components
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── footer.tsx
├── features/            # Feature-specific components
│   ├── accounting/
│   ├── clients/
│   └── reports/
└── shared/              # Shared business components
    ├── finance-card.tsx
    ├── status-badge.tsx
    └── data-table.tsx

```

### Naming Conventions

```tsx
// Component files: PascalCase
Button.tsx
FinanceCard.tsx

// Utility files: camelCase
formatCurrency.ts
validateNIP.ts

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5242880

// CSS classes: kebab-case (Tailwind standard)
className="text-primary-700 hover:text-primary-800"

```

### Responsive Design Patterns

```tsx
// Mobile-first responsive utilities
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Dashboard
  </h1>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Cards */}
  </div>
</div>

```

### Dark Mode Support

```tsx
// Component with dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h2 className="text-primary-700 dark:text-primary-400">
    Financial Overview
  </h2>
</div>

```

### Accessibility Checklist

-   [ ] All interactive elements have focus states
-   [ ] Color contrast ratio ≥ 4.5:1 for normal text
-   [ ] Color contrast ratio ≥ 3:1 for large text
-   [ ] Form inputs have associated labels
-   [ ] Error messages are announced to screen readers
-   [ ] Keyboard navigation works for all interactions
-   [ ] ARIA labels for icon-only buttons
-   [ ] Semantic HTML elements used appropriately

### Performance Guidelines

```tsx
// Lazy load heavy components
const ReportsModule = lazy(() => import('./features/reports'))

// Optimize images
import Image from 'next/image'

// Use memo for expensive computations
const expensiveValue = useMemo(() => 
  calculateFinancialMetrics(data), [data]
)

// Virtualize long lists
import { VirtualList } from '@tanstack/react-virtual'

```

### State Management Patterns

```tsx
// Local state for UI
const [isOpen, setIsOpen] = useState(false)

// Zustand for global state
const useAccountingStore = create((set) => ({
  clients: [],
  addClient: (client) => set((state) => ({ 
    clients: [...state.clients, client] 
  })),
}))

// React Query for server state
const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: fetchTransactions,
})

```

### Form Validation with Zod

```tsx
// Schema definition
const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nip: z.string().regex(/^\d{10}$/, 'NIP must be 10 digits'),
  email: z.string().email('Invalid email address'),
  vatStatus: z.enum(['active', 'exempt', 'inactive']),
})

// Form component with React Hook Form
const form = useForm<z.infer<typeof clientSchema>>({
  resolver: zodResolver(clientSchema),
})

```

### Testing Strategy

```tsx
// Component testing with React Testing Library
describe('FinanceCard', () => {
  it('displays correct trend icon for positive change', () => {
    render(<FinanceCard title="Revenue" value="$10,000" change={5} trend="up" />)
    expect(screen.getByTestId('trend-up-icon')).toBeInTheDocument()
  })
})

// E2E testing with Playwright
test('user can create new invoice', async ({ page }) => {
  await page.goto('/invoices/new')
  await page.fill('[name="amount"]', '1000')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/invoices')
})

```

----------

## Design Tokens for CSS-in-JS

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    financial: {
      profit: '#10b981',
      loss: '#ef4444',
      neutral: '#6b7280',
      pending: '#f59e0b',
    },
  },
  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
}

```

----------

## Conclusion

This design system provides a solid foundation for your accounting CRM application with:

✅ **Professional Aesthetics** - Dark green primary color conveys trust and financial expertise  
✅ **Tailwind Compatibility** - Full integration with Tailwind CSS utility classes  
✅ **shadcn/ui Ready** - Customized components that work seamlessly with shadcn/ui  
✅ **Scalable Architecture** - Modular approach for easy maintenance and expansion  
✅ **Accessibility Built-in** - WCAG 2.1 AA compliant components  
✅ **Performance Optimized** - Lightweight CSS with PurgeCSS support  
✅ **Dark Mode Support** - Complete dark theme implementation  
✅ **Financial Context** - Specialized components for accounting workflows

### Next Steps

1.  Install Tailwind CSS and shadcn/ui in your project
2.  Copy the configuration files to your project
3.  Start building components using the design tokens
4.  Customize further based on user feedback
5.  Document any additions to maintain consistency

This design system will evolve with your application needs while maintaining visual consistency and professional appearance throughout the accounting CRM platform.
