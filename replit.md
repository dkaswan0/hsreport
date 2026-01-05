# High Safety Vehicle Inspection System

## Overview

This is a bilingual (Arabic/English) vehicle inspection management system built for automotive safety assessment. The application enables examiners to create detailed vehicle inspections, document faults with photos, and generate professional PDF reports. It features VIN decoding, OCR-based VIN scanning, AI-powered fault suggestions, and an interactive visual car diagram showing inspection results by category.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: jsPDF with html2canvas for client-side report generation
- **OCR**: Tesseract.js for VIN scanning from images

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Build Tool**: Custom build script using esbuild for server and Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for main tables, `shared/models/chat.ts` for AI chat tables
- **Tables**: users, inspections, inspectionItems, faultLibrary, conversations, messages

### Key Design Patterns
- **Shared Types**: Schema definitions and route contracts are shared between frontend and backend in the `shared/` directory
- **Type-Safe API**: Route definitions include input/output Zod schemas for compile-time and runtime validation
- **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared code

### Inspection Categories
The system organizes vehicle inspections into 12 categories: Engine, Transmission, Chassis, Body, Tires, Brakes, Electrical, Wheels, Suspension, AC/Cooling, Exhaust, and Safety.

## External Dependencies

### AI Integrations
- **OpenAI API**: Used via Replit AI Integrations for chat completions and image generation
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Features**: AI-powered fault suggestions, image generation for reports

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for Express session persistence

### External APIs
- **VIN Decoder**: API integration for decoding vehicle identification numbers (referenced in hooks)

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: Database ORM and migration tools
- **zod**: Runtime schema validation
- **html2canvas** / **jspdf**: PDF report generation
- **tesseract.js**: OCR for VIN scanning
- **@zxing/library**: Barcode/QR scanning capability