# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lamacro** is a Next.js financial data platform focused on Argentine financial markets. It provides tools for analyzing government bonds, inflation data, stock performance, debt information, and various financial calculations. The app integrates with the BCRA (Central Bank of Argentina) API and other financial data sources.

## Development Commands

```bash
# Development
pnpm dev                    # Start development server with Turbopack
pnpm build                  # Production build
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix              # Fix ESLint issues automatically

# Testing
pnpm test                   # Run tests with Vitest
pnpm test:ui               # Run tests with Vitest UI
pnpm test:coverage         # Run tests with coverage report
```

## Architecture Overview

### Core Business Logic (`/lib`)
- **API Integration**: `bcra-api-helper.ts` and `bcra-fetch.ts` handle BCRA API calls with circuit breaker pattern, rate limiting, and Redis fallback caching
- **Financial Instruments**: Separate modules for different asset classes:
  - `acciones.ts` - Stock market analysis with inflation-adjusted returns
  - `carry-trade.ts` - Government bond arbitrage analysis with MEP calculations
  - `duales.ts` - Dual currency bond analysis with scenario modeling
  - `fija.ts` - Fixed income securities with yield calculations (TNA, TEM, TEA)
  - `debts.ts` - Central Bank debt registry integration
- **Caching**: `redis-cache.ts` provides 7-day TTL fallback for BCRA data
- **Server Actions**: `actions.ts` and `tamar-actions.ts` bridge UI and server-side calculations

### Data Flow Pattern
```
External APIs → bcra-api-helper → bcra-fetch → Domain Logic → UI Components
                      ↓
                 redis-cache (fallback)
```

### Key Technical Features
- Circuit breaker pattern for API resilience
- Multi-level caching (in-memory + Redis)
- Comprehensive error handling with graceful degradation
- Business day calculations for financial accuracy
- Rate limiting to respect API constraints

### UI Structure
- **App Router**: Next.js 15 app directory structure
- **Components**: Domain-specific components in `/components` matching business logic modules
- **Styling**: Tailwind CSS with shadcn/ui components
- **Theme**: Dark/light mode support with next-themes

## Important Configuration

### Environment Variables
- Redis connection for caching BCRA data
- External API endpoints for financial data
- PostHog analytics integration

### External Dependencies
- **BCRA API**: Primary data source for macroeconomic variables
- **Redis**: Caching layer for API fallback
- **Excel Export**: XLSX library for data export functionality

## Testing Strategy
- Vitest with Node environment
- Comprehensive test coverage in `/lib/__tests__`
- Tests cover all financial calculation modules and API helpers
- Path alias `@` points to project root

## Next.js 15 App Router Best Practices

### Server-First Architecture
- **Data fetching**: Always perform data fetching in Server Components, never in Client Components
- **Server Actions**: Use Server Actions (`actions.ts`, `tamar-actions.ts`) for mutations and form handling
- **Minimize 'use client'**: Only use `'use client'` directive when absolutely necessary for:
  - Event handlers (onClick, onChange, onSubmit)
  - Browser APIs (localStorage, document, window)
  - React hooks (useState, useEffect, useContext)
  - Third-party libraries that require client-side execution

### Component Patterns
- **Server Components by default**: All components should be Server Components unless they need client-side interactivity
- **Client Component boundaries**: Keep Client Components as leaf nodes in the component tree when possible
- **Data passing**: Pass data from Server Components to Client Components via props, not by fetching in Client Components
- **Composition over 'use client'**: Use component composition to avoid marking parent components as Client Components

### Performance Optimization
- **Streaming**: Leverage React Suspense and loading.tsx files for progressive page loading
- **Partial Pre-rendering**: Structure components to maximize static generation while allowing dynamic content
- **Server-side caching**: Utilize the existing Redis cache and in-memory caching for BCRA API responses
- **Avoid waterfalls**: Fetch all required data in parallel at the Server Component level

### File Structure Guidelines
- **page.tsx**: Always Server Components for route handlers and initial data fetching
- **loading.tsx**: Use for streaming UI and better perceived performance, only if main data fetching is made in page.tsx. Otherwise, use Suspense.
- **error.tsx**: Server-side error boundaries for graceful error handling

## Key Business Rules
- All financial calculations must handle Argentine business days and holidays
- BCRA API rate limits must be respected (circuit breaker at 10 failures)
- Cache TTL is 7 days for fallback scenarios
- Date calculations use business day logic for accuracy
- Yield calculations follow Argentine financial market conventions