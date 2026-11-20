# CampusVoice – Architecture

## Architecture Style

CampusVoice follows a modular monolith architecture.

The application is deployed as one Next.js application while maintaining clear boundaries between features and services.

## Application Layers

### 1. Presentation Layer

Location: `src/app/` and `src/components/`

Responsible for pages, layouts, navigation and reusable UI components.

### 2. Feature Layer

Location: `src/features/`

Contains feature-specific components, types, validation schemas and workflows.

Initial modules:

- Authentication
- Questionnaires
- Submissions
- Reports
- Analytics
- Assessments
- Roster
- Lookups

### 3. Server Layer

Location: `src/server/`

Responsible for authorization, business services and server-side operations.

### 4. Infrastructure Layer

Location: `src/lib/` and `prisma/`

Responsible for database connections, environment validation, shared utilities and schema migrations.

## Architectural Principles

1. Single source of truth for permissions.
2. Server-side authorization.
3. Feature-oriented organization.
4. Reusable questionnaire engine.
5. Stable database identifiers.
6. Centralized input validation.
7. Versioned questionnaire submissions.
8. Auditability of sensitive operations.
9. Student identity protection.
10. Automated testing.

## Database

PostgreSQL is the primary database.

Prisma ORM manages schema definitions, database migrations and type-safe queries.

## Deployment

The initial production deployment target is Vercel.

The production database will be hosted separately from the application deployment.
