# HomeMatch

HomeMatch is a full-stack real estate application for browsing residential property listings. The project includes a Next.js frontend, a Spring Boot backend, and a PostgreSQL database managed through Flyway migrations.

## Main Features

- Browse paginated property listings.
- Filter listings by location, price, beds, baths, square footage, and energy score.
- Sort listings by price, beds, square footage, and energy score.
- View listing details and listing photos.
- Save and remove favorites for authenticated users.
- Discover listings through swipe-based interactions.
- Undo the last favorite action in the frontend workflow.
- Compare selected listings in the frontend.
- Authenticate users with Supabase email/password auth and Google OAuth.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Java 25, Spring Boot 4, Spring Web MVC, Spring Security, Spring Data JPA |
| Database | PostgreSQL, Flyway |
| Authentication | Supabase Auth, JWT resource server validation |
| Testing | JUnit, Spring Boot Test, Testcontainers, Jest, Testing Library, Playwright |
| Tooling | Maven Wrapper, npm, Volta, Docker Compose |

## Repository Structure

```text
.
|-- backend/                 Spring Boot API, Flyway migrations, backend tests
|-- frontend/                Next.js application, Jest tests, Playwright tests
|-- .github/workflows/       Pull request CI workflow
|-- docker-compose.e2e.yml   Disposable PostgreSQL database for Playwright tests
|-- CONTRIBUTING.md          Branch, commit, and pull request workflow
`-- README.md                Project overview and quick start
```

## Prerequisites

- Git
- Java 25
- Docker Desktop or another Docker Compose-compatible runtime
- Volta, or Node.js 24.13.1 and npm
- PostgreSQL CLI tools if running Playwright tests locally, because the e2e seed utility calls `psql`

Check installed versions:

```bash
java --version
git --version
docker --version
docker compose version
node --version
npm --version
```

## Environment Variables

The backend loads configuration from `backend/.env`, the repository root `.env`, and `frontend/.env.local` when run from `backend/`.

Local environment files are ignored by Git and should not be committed.

### Backend

Create `.env` at the repository root:

```properties
DB_URL=jdbc:postgresql://<host>:<port>/<database>
DB_USERNAME=<database-user>
DB_PASSWORD=<database-password>
```

Optional backend variables:

```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_JWT_ISSUER_URI=<jwt-issuer-uri>
SUPABASE_JWT_JWK_SET_URI=<jwt-jwk-set-uri>
SUPABASE_JWT_AUDIENCE=authenticated
```

`SUPABASE_SERVICE_ROLE_KEY` is required for account deletion through `DELETE /api/users/me`. It is not required for listing browsing or favorites.

### Frontend

Create `frontend/.env.local`:

```properties
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

Optional variables for local Playwright auth tests:

```properties
E2E_AUTH_EMAIL_ONE=<test-user-email>
E2E_AUTH_PASSWORD_ONE=<test-user-password>
E2E_AUTH_EMAIL_TWO=<test-user-email>
E2E_AUTH_PASSWORD_TWO=<test-user-password>
```

The Playwright auth isolation test is skipped when these credentials are not configured.

## Database and Migrations

The backend uses Flyway migrations from `backend/src/main/resources/db/migration`.

Current migrations create and update:

- `listings`
- `users`
- `favorites`
- listing search indexes, including `pg_trgm` for address search
- listing ZIP code and energy score fields

For regular development, configure the backend datasource variables to point at a PostgreSQL database. Flyway runs automatically when the backend starts.

For local end-to-end tests, use the disposable PostgreSQL service:

```bash
docker compose -f docker-compose.e2e.yml up -d
```

This starts PostgreSQL on local port `5433` with database `homematch_e2e`.

## Run Locally

Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

The backend runs at `http://localhost:8081`.

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

## Testing

Run backend tests:

```bash
cd backend
./mvnw test
```

Run the backend CI build locally:

```bash
cd backend
./mvnw clean verify
```

Run frontend unit and component tests:

```bash
cd frontend
npm test -- --watchAll=false
```

Run frontend linting:

```bash
cd frontend
npm run lint
```

Run end-to-end tests:

```bash
docker compose -f docker-compose.e2e.yml up -d
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=e2e
```

In another terminal:

```bash
cd frontend
npx playwright install
npm run test:e2e
```

Playwright starts the frontend development server on `http://127.0.0.1:3000` and uses the backend at `http://127.0.0.1:8081`.

## API Overview

The backend base URL is `http://localhost:8081`.

Public endpoints:

- `GET /api/listings`
- `GET /api/listings/{id}`
- `GET /api/listings/availability?ids=1&ids=2`
- `GET /api/listings/suggestions?q=<query>&limit=<limit>`

Authenticated endpoints:

- `GET /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/me/favorites`
- `POST /api/users/me/favorites`
- `DELETE /api/users/me/favorites/{listingId}`

Authenticated requests require an `Authorization: Bearer <supabase-access-token>` header.

See [backend/README.md](./backend/README.md) for endpoint parameters and examples.

## Authentication Flow

- The frontend uses Supabase client helpers for browser, server, and middleware session handling.
- Email/password login and signup use Supabase Auth.
- Google OAuth redirects through `/auth/callback`, exchanges the code for a session, and redirects to a safe internal path.
- The backend validates Supabase JWTs as a stateless OAuth2 resource server.
- On authenticated backend requests, the user is created or loaded from the local `users` table using the Supabase subject.

## Development Workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, pull request, review, and merge guidance.

For component-specific setup, see:

- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)

## Development Notes

- The backend default profile is `dev`.
- The `e2e` backend profile connects to the Docker Compose PostgreSQL service on port `5433`.
- Listing endpoints are public. User and favorite endpoints require authentication.
- Set `NEXT_PUBLIC_API_BASE_URL` explicitly in `frontend/.env.local`; authenticated API calls read it directly from the environment.
