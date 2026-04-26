# HomeMatch Backend

The HomeMatch backend is a Spring Boot API that serves listing data, search suggestions, user profiles, and favorites. It uses PostgreSQL for persistence, Flyway for migrations, and Supabase JWTs for authenticated routes.

## Prerequisites

- Java 25
- Git
- Docker, if running local e2e PostgreSQL or Testcontainers-backed tests
- PostgreSQL database credentials for development

Check Java:

```bash
java --version
```

## Configuration

Run backend commands from `backend/`. The application imports environment values from these files when present:

- `backend/.env`
- `../.env`
- `../frontend/.env.local`

Create the repository root `.env` for normal development or export the following variables in the terminal:

```properties
DB_URL=jdbc:postgresql://<host>:<port>/<database>
DB_USERNAME=<database-user>
DB_PASSWORD=<database-password>
```

Equivalent Spring datasource variables are also supported:

```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
```

Authentication-related variables:

```properties
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_JWT_ISSUER_URI=<jwt-issuer-uri>
SUPABASE_JWT_JWK_SET_URI=<jwt-jwk-set-uri>
SUPABASE_JWT_AUDIENCE=authenticated
```

Notes:

- `SUPABASE_URL` can also be supplied through `NEXT_PUBLIC_SUPABASE_URL` from `frontend/.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY` is required only for `DELETE /api/users/me`.
- If JWT issuer and JWK set variables are not supplied, the backend uses the defaults configured in `application.yml`.
- Do not commit `.env` files or service role keys.

## Run the Backend

From the repository root:

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8081`.

## Database and Migrations

Flyway migrations are stored in `src/main/resources/db/migration`.

The current migrations manage:

- `listings`
- `users`
- `favorites`
- favorite uniqueness constraints
- listing ZIP code and energy score columns
- indexes for ZIP, price, and trigram address search

The backend validates the JPA schema with `spring.jpa.hibernate.ddl-auto=validate`. Flyway runs migrations during application startup.

## E2E Profile

The `e2e` profile connects to the disposable PostgreSQL database defined in `../docker-compose.e2e.yml`.

Start the database:

```bash
docker compose -f ../docker-compose.e2e.yml up -d
```

Run the backend with the e2e profile:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=e2e
```

The e2e datasource is:

```text
jdbc:postgresql://localhost:5433/homematch_e2e
```

## Testing

Run backend tests:

```bash
./mvnw test
```

Run the backend CI build locally:

```bash
./mvnw clean verify
```

The backend test suite includes controller, service, repository, security, rate limiting, mapper, and integration tests. Some integration tests use Testcontainers.

## API Overview

Base URL:

```text
http://localhost:8081
```

### Authentication

Public listing routes do not require authentication. User and favorite routes require:

```http
Authorization: Bearer <supabase-access-token>
```

The backend validates JWT issuer, audience, signature, expiration, and subject.

### Listings

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/listings` | Return paginated listings with filters and sorting | No |
| `GET` | `/api/listings/{id}` | Return one listing by id | No |
| `GET` | `/api/listings/availability` | Return the subset of requested listing ids that still exist | No |
| `GET` | `/api/listings/suggestions` | Return address and ZIP search suggestions | No |

#### `GET /api/listings`

Query parameters:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | integer | `0` | Must be `>= 0` |
| `size` | integer | `20` | Must be from `1` to `100` |
| `location` | string | none | ZIP exact match for 5 digits; otherwise case-insensitive address match |
| `minPrice` | decimal | none | Must be `>= 0` |
| `maxPrice` | decimal | none | Must be `>= 0`; must be `>= minPrice` when both are present |
| `minBeds` | integer | none | Must be `>= 0` |
| `minBaths` | decimal | none | Must be `>= 0` |
| `minSqft` | integer | none | Must be `>= 0` |
| `maxSqft` | integer | none | Must be `>= 0`; must be `>= minSqft` when both are present |
| `minEnergyStarScore` | integer | none | Must be `>= 0` |
| `sortOption` | enum | `PRICE_ASC` behavior | See supported values below |

Supported `sortOption` values:

- `PRICE_ASC`
- `PRICE_DESC`
- `BEDS_ASC`
- `BEDS_DESC`
- `SQFT_ASC`
- `SQFT_DESC`
- `ENERGY_DESC`

Example:

```bash
curl "http://localhost:8081/api/listings?page=0&size=10&minPrice=200000&maxPrice=500000&minBeds=3&minBaths=2&sortOption=PRICE_DESC"
```

Response shape:

```json
{
  "content": [
    {
      "id": 1,
      "address": "77 Duff Rd, Pittsburgh, PA 15235",
      "zipCode": "15235",
      "price": 299900,
      "sqft": 1648,
      "beds": 3,
      "baths": 2,
      "energyStarScore": 80,
      "listingUrl": "https://example.com/listing",
      "photoUrls": ["https://example.com/photo.jpg"]
    }
  ],
  "totalElements": 120,
  "totalPages": 12,
  "size": 10,
  "number": 0
}
```

#### `GET /api/listings/{id}`

```bash
curl "http://localhost:8081/api/listings/1"
```

#### `GET /api/listings/availability`

```bash
curl "http://localhost:8081/api/listings/availability?ids=1&ids=2&ids=3"
```

Returns:

```json
[1, 3]
```

#### `GET /api/listings/suggestions`

Query parameters:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `q` | string | required | Must contain 1 to 100 characters |
| `limit` | integer | `5` | Must be from `1` to `10` |

Example:

```bash
curl "http://localhost:8081/api/listings/suggestions?q=152&limit=5"
```

Response shape:

```json
[
  {
    "type": "zip",
    "label": "15213",
    "listingId": null,
    "zipCode": "15213"
  },
  {
    "type": "address",
    "label": "1111 Forbes Ave",
    "listingId": 10,
    "zipCode": "15213"
  }
]
```

### Current User

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/users/me` | Return current user metadata | Yes |
| `DELETE` | `/api/users/me` | Delete the current user locally and in Supabase Auth | Yes |

Example:

```bash
curl -H "Authorization: Bearer <supabase-access-token>" \
  "http://localhost:8081/api/users/me"
```

Response shape:

```json
{
  "sub": "supabase-user-id",
  "supabaseUserId": "supabase-user-id",
  "email": "user@example.com"
}
```

### Favorites

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/users/me/favorites` | Return current user's favorites | Yes |
| `POST` | `/api/users/me/favorites` | Add a favorite listing | Yes |
| `DELETE` | `/api/users/me/favorites/{listingId}` | Remove a favorite listing | Yes |

Get favorites:

```bash
curl -H "Authorization: Bearer <supabase-access-token>" \
  "http://localhost:8081/api/users/me/favorites"
```

Add a favorite:

```bash
curl -X POST "http://localhost:8081/api/users/me/favorites" \
  -H "Authorization: Bearer <supabase-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"listingId": 42}'
```

Remove a favorite:

```bash
curl -X DELETE "http://localhost:8081/api/users/me/favorites/42" \
  -H "Authorization: Bearer <supabase-access-token>"
```

Favorite response shape:

```json
{
  "id": 10,
  "createdAt": "2026-04-24T12:00:00",
  "listing": {
    "id": 42,
    "address": "42 Test St",
    "zipCode": "15213",
    "price": 250000,
    "sqft": 1400,
    "beds": 3,
    "baths": 2,
    "energyStarScore": 75,
    "listingUrl": "https://example.com/listing",
    "photoUrls": []
  }
}
```

## Development Notes

- DTOs are returned from API endpoints instead of JPA entities.
- Listing filtering is implemented with Spring Data JPA specifications.
- Rate limits apply to `/api/**` routes and are configured under `app.security.rate-limit`.
- CORS allowed origins are configured under `app.security.allowed-origins`.
