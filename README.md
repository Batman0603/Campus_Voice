# CampusVoice

**Pedagogy and Performance Feedback System**

CampusVoice is a centralized school feedback and academic performance analytics platform developed for The Nest School, Academic Year 2026–27.

## Overview

CampusVoice provides a unified platform for collecting, managing and analyzing feedback from students, teachers, SEN mentors, Heads of Department and school leadership.

The platform combines configurable questionnaires, conditional branching, feedback reporting and academic performance analytics.

## Technology Stack

- Next.js – Full-stack React framework
- React – User interface
- TypeScript – Application language
- Tailwind CSS – Styling
- shadcn/ui – UI components
- PostgreSQL – Relational database
- Prisma ORM – Database access and migrations
- Zod – Validation
- Auth.js – Authentication
- Vitest – Unit and integration testing
- Playwright – End-to-end testing

## Application Modules

1. Student Voice
2. Teacher Reflection
3. SEN
4. HoD Checks
5. Leadership Report
6. Feedback Reports
7. Academic Performance Analytics

## Getting Started

### Prerequisites

- Node.js 22.20.0
- npm
- PostgreSQL
- Git

### Installation

```bash
git clone <repository-url>
cd campusvoice
npm install
```

Create a local `.env` file using `.env.example` and configure the PostgreSQL connection strings.

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

Open http://localhost:3000.

## Development Commands

| Command                     | Purpose                          |
| --------------------------- | -------------------------------- |
| `npm run dev`               | Start development server         |
| `npm run build`             | Generate Prisma Client and build |
| `npm run start`             | Start production server          |
| `npm run lint`              | Run ESLint                       |
| `npm run typecheck`         | Check TypeScript                 |
| `npm run format`            | Format source files              |
| `npm run db:generate`       | Generate Prisma Client           |
| `npm run db:migrate`        | Run development migration        |
| `npm run db:migrate:deploy` | Apply production migrations      |
| `npm run db:studio`         | Open Prisma Studio               |

## Architecture

CampusVoice follows a modular monolith architecture with feature-oriented application modules and centralized server-side services.

See `docs/architecture.md` for details.

## Development

See `CONTRIBUTING.md` for branching conventions, coding standards and contribution guidelines.

## Project Status

Initial foundation and infrastructure setup.
