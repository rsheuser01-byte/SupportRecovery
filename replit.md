# Healthcare Management System

## Overview

This is a full-stack healthcare management application built for tracking revenue, expenses, and staff payouts across multiple healthcare facilities. The system manages houses (facilities), service codes, staff members, patients, revenue entries, and expenses with automated payout calculations based on configurable rates.

The application features a React frontend with shadcn/ui components, an Express.js backend API, and PostgreSQL database with Drizzle ORM for data management.

**Recent Enhancements (August 2025):**
- Added comprehensive check tracking filtering system with month-based and custom date filters
- Fixed critical date parsing timezone issues affecting both check tracking and revenue entry filters  
- Implemented safe date parsing to prevent JavaScript Date() timezone interpretation bugs
- All filter systems now use consistent manual string parsing for reliable month boundary detection
- **Fixed calendar date filtering bug (August 9, 2025):** Daily reports now correctly filter by processing date (checkDate) instead of service date, ensuring accurate calendar-based revenue tracking
- **Hourly Employee Tracking System (August 14, 2025):**
  - Completed full hourly employee tracking implementation with database tables, API endpoints, and UI components
  - Fixed multiple API request errors by correcting fetch method calls from apiRequest to proper fetch syntax
  - Resolved form validation issue allowing whole number hours input by adjusting step increment
  - Fixed expense deletion for hourly payments to properly handle linked time entries (unmarks time entries as paid when expense is deleted)
  - Fixed bulk time entry payment processing by correcting Drizzle ORM query to use inArray instead of incorrect and/eq combination
  - Fixed timezone issues in time entry date handling with proper local timezone conversion
  - **Critical Fix:** Resolved bulk payment processing to create separate expenses per employee instead of grouping all under one vendor name
  - Added delete functionality for individual time entries with edit and delete buttons in Actions column
  - **Mobile Authentication Fix:** Fixed iPhone internal server error by making session cookies environment-dependent (secure: false in development, secure: true in production) and added SameSite configuration for cross-origin compatibility
  - **Enhanced Error Logging:** Added detailed error logging with user agent and request details for debugging mobile-specific issues
  - **Pre-approved User ID Mismatch Fix (August 14, 2025):** Resolved iPhone authentication issue for gclemons22@gmail.com caused by pre-approved user record having custom ID instead of actual Replit user ID. Added automatic migration logic to detect email-based pre-approved records and update them with correct Replit user IDs during login.
  - **Dialog Accessibility:** Fixed missing DialogDescription warnings by adding proper accessibility descriptions to time entry and hourly employee modals
- **UI/UX Improvements (August 5 & 14, 2025):**
  - Enhanced header visibility with high-contrast design for improved readability
  - Updated sidebar header with white background, blue gradient borders, and black text
  - Fixed main dashboard header with white background and maximum contrast black text
  - Added pre-approved user support for gclemons22@gmail.com (George Clemons)
  - Reduced header heights to match interface consistency across all sections
  - **Visual Consistency Fix (August 14, 2025):** Standardized all section headers across all tabs to match navigation tab theme with consistent border colors, font sizes (3xl), white backgrounds with shadow-lg, and gradient button styling matching each tab's color scheme
- **Bug Fixes Applied (August 5-9, 2025):**
  - Optimized dashboard filtering performance by memoizing all filter functions using `useMemo`
  - Fixed excessive re-computation of filtered data causing performance issues
  - Resolved TypeScript compilation errors in daily report API route date handling
  - Enhanced error handling in React Query with intelligent retry logic for network failures
  - Added proper error boundaries for 4xx/5xx HTTP responses
  - Improved stale time configuration for better caching (5 minutes)
  - Fixed missing type exports in schema for `Payout`, `BusinessSettings`, and `CheckTracking`
  - **Mobile UX Enhancement (August 9, 2025):** Added hamburger menu auto-close functionality when navigating tabs for improved mobile experience
- **Console Error Fixes (August 9, 2025):** Resolved dashboard filter console errors by improving date parsing logic to handle full ISO timestamp strings, removing excessive debug logging, and enhancing date validation in all filtering functions
- **Dashboard Optimization (August 9, 2025):** Fixed dashboard statistics calculations with dynamic month-over-month comparisons, removed Total Staff card to save space, and optimized remaining 4 cards layout with improved grid spacing for better visual balance
- **Revenue Report Bug Fix (August 9, 2025):** Fixed critical bug where monthly revenue reports were showing all-time data instead of current month filtered data. Reports now properly filter by checkDate/processing date and calculate accurate monthly/quarterly totals with period descriptions.

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Preferences: High contrast design with maximum text visibility, white backgrounds with dark text for optimal readability.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for form handling
- **Charts**: Recharts for revenue visualization

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints with structured error handling
- **Middleware**: Request logging, JSON parsing, and error handling
- **Development**: Hot reload with Vite integration for seamless development

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Strongly typed schema definitions with foreign key relationships
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: PostgreSQL with persistent data storage
- **Storage**: DbStorage class implements full database persistence for all entities

### Data Models
- **Houses**: Healthcare facilities with name and address
- **Service Codes**: Billable service types with codes and descriptions  
- **Staff**: Healthcare workers eligible for payouts
- **Patients**: Client records linked to houses and programs
- **Revenue Entries**: Income records with service and staff associations
- **Expenses**: Operating costs with vendor and category tracking
- **Payout Rates**: Configurable percentage rates by house/service/staff combination

### Authentication & Security
- Session-based authentication using express-session
- PostgreSQL session store with connect-pg-simple
- CORS configuration for cross-origin requests

### Build & Deployment
- **Development**: Concurrent client and server with hot reload
- **Production**: Vite build for client, esbuild for server bundling
- **Static Assets**: Served through Express in production

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pool**: @neondatabase/serverless for optimized connections

### UI Components
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Chart library for data visualization
- **Embla Carousel**: Touch-friendly carousel component

### Development Tools
- **Vite**: Fast development server and build tool
- **esbuild**: Fast JavaScript bundler for production
- **TypeScript**: Static type checking across the stack
- **Drizzle Kit**: Database migration and introspection tools

### Validation & Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form library with validation
- **@hookform/resolvers**: Zod integration for form validation

The system is designed for scalability with clear separation between frontend, backend, and database layers, making it easy to maintain and extend functionality.