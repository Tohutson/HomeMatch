# HomeMatch Frontend

The HomeMatch frontend is a Next.js application for property browsing, filtering, comparison, favorites, swipe interactions, and Supabase authentication.

## Prerequisites

- Volta, or Node.js 24.13.1 and npm
- Running HomeMatch backend for API-backed pages
- Supabase project URL and publishable key for authentication

Install dependencies:

```bash
npm install
```

The repository pins Node.js `24.13.1` through Volta in `package.json`.

## Configuration

Create `frontend/.env.local`:

```properties
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

Optional Playwright auth variables:

```properties
E2E_AUTH_EMAIL_ONE=<test-user-email>
E2E_AUTH_PASSWORD_ONE=<test-user-password>
E2E_AUTH_EMAIL_TWO=<test-user-email>
E2E_AUTH_PASSWORD_TWO=<test-user-password>
```

Do not commit `.env.local`.

## Run the Frontend

```bash
npm run dev
```

The application runs at `http://localhost:3000`.

The backend should be running at the URL configured in `NEXT_PUBLIC_API_BASE_URL`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production application |
| `npm run start` | Start the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:e2e` | Run Playwright tests |

## Testing

Run unit and component tests:

```bash
npm test -- --watchAll=false
```

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

## End-to-End Tests

Playwright tests are in `frontend/e2e`.

Before running them locally:

1. Start the e2e database from the repository root.
2. Start the backend with the `e2e` profile.
3. Run Playwright from `frontend`.

```bash
cd ..
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

Playwright starts the frontend development server automatically on `http://127.0.0.1:3000` and sets `NEXT_PUBLIC_API_BASE_URL` to `http://127.0.0.1:8081`.

The local e2e seed utility uses `psql` to load SQL files from `backend/e2e` into the Docker PostgreSQL database on port `5433`.

The auth isolation e2e test is skipped unless all four `E2E_AUTH_*` variables are configured.

## Application Structure

```text
src/
|-- app/                    Next.js app routes and page entry points
|-- components/             Shared UI components
|-- features/
|   |-- auth/               Supabase auth context and clients
|   |-- favorites/          Favorites API, hooks, and pages
|   |-- listings/           Listing API, filters, cards, comparison, pages
|   |-- profile/            Profile page
|   `-- search/             Search suggestions API and search bar
|-- lib/                    Shared API, environment, and utility modules
`-- styles/                 Global styles
```

## Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Home/search entry point |
| `/listings` | Listing browsing, filtering, sorting, pagination, and swipe interactions |
| `/listings/[id]` | Listing detail page |
| `/favorites` | Authenticated saved listings page |
| `/compare` | Listing comparison page |
| `/login` | Login page |
| `/signup` | Signup page |
| `/profile` | Authenticated profile page |
| `/auth/callback` | Supabase OAuth callback route |

## Authentication Flow

- `AuthProvider` stores Supabase session state and exposes login, signup, Google OAuth, and logout actions.
- Browser, server, and middleware Supabase clients are defined under `src/features/auth/lib`.
- Google OAuth redirects to `/auth/callback`, exchanges the auth code for a session, and redirects to a safe internal path.
- Authenticated API calls attach the Supabase access token through `src/lib/api.ts`.

## Backend Integration

The frontend reads `NEXT_PUBLIC_API_BASE_URL` for backend requests. It uses these backend routes:

- `GET /api/listings`
- `GET /api/listings/{id}`
- `GET /api/listings/availability`
- `GET /api/listings/suggestions`
- `GET /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/me/favorites`
- `POST /api/users/me/favorites`
- `DELETE /api/users/me/favorites/{listingId}`

## Development Notes

- Jest uses `jest-environment-jsdom` and ignores `frontend/e2e`.
- Playwright runs serially with one worker because tests share a disposable database.
- The comparison feature limits the selected listing set in frontend state.
- Offline favorite actions are stored in browser local storage and cleared on logout for the current user.
