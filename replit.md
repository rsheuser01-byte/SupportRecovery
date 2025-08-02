# Healthcare Management System

## Overview

This is a full-stack healthcare management application built for tracking revenue, expenses, and staff payouts across multiple healthcare facilities. The system manages houses (facilities), service codes, staff members, patients, revenue entries, and expenses with automated payout calculations based on configurable rates.

The application features a React frontend with shadcn/ui components, an Express.js backend API, and PostgreSQL database with Drizzle ORM for data management.

## User Preferences

Preferred communication style: Simple, everyday language.

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