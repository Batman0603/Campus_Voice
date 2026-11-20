# Contributing to CampusVoice

Thank you for contributing to CampusVoice.

## Development Workflow

The project uses a lightweight Git branching strategy.

- `main`: stable production-ready code.
- `develop`: integrated development branch.
- `feature/*`: new functionality.
- `fix/*`: bug fixes.
- `docs/*`: documentation changes.

## Branch Naming

Examples:

```text
feature/authentication
feature/questionnaire-builder
feature/branching-engine
fix/database-connection
docs/api-documentation
```

## Commit Convention

Use conventional commit messages.

Examples:

```text
feat: add questionnaire builder
fix: correct submission validation
refactor: separate report services
docs: update architecture guide
test: add branching engine tests
chore: update dependencies
```

## Pull Request Requirements

Every pull request should:

1. Explain the purpose of the change.
2. Reference the relevant issue or task.
3. Follow existing architecture and naming conventions.
4. Pass ESLint checks.
5. Pass TypeScript checks.
6. Include tests where appropriate.
7. Avoid committing environment secrets.
8. Include database migrations when schema changes are necessary.

## Coding Standards

- Use TypeScript strict mode.
- Prefer small, reusable components.
- Keep business logic outside UI components.
- Validate external inputs using Zod.
- Keep database operations server-side.
- Use Prisma migrations for database changes.
- Follow existing naming conventions.
- Avoid unnecessary dependencies.

## Security

- Never commit `.env` files.
- Never trust frontend authorization.
- Never expose student identities in reports.
- Never bypass server-side validation.
- Never hard-delete records that require archival.

## Database Changes

Every database schema change must include its corresponding Prisma migration.

Do not edit an already-applied migration to change production database structure. Create a new migration instead.
