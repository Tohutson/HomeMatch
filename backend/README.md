# HomeMatch Backend

Spring Boot backend for HomeMatch, connected to a shared Supabase PostgreSQL database.

## Prerequisites

- JDK 25+
- Git

Check Java version:

```bash
java --version
```

---

## Team Setup (One-Time)

Get the shared `.env` file from the team owner and place it in:

```
HomeMatch/.env
```

Notes:

- Teammates do **not** need their own Supabase account
- Never commit `.env` to git

---

## Run Backend

From project root:

```bash
cd backend
```

Windows (PowerShell):

```powershell
.\mvnw.cmd spring-boot:run
```

macOS / Linux:

```bash
./mvnw spring-boot:run
```

Backend runs at:

```text
http://localhost:8081
```

---

## API Documentation

Base URL:

```text
http://localhost:8081
```

---

## Listings API

### Endpoints

| Method | Path                 | Description                           |
| ------ | -------------------- | ------------------------------------- |
| GET    | `/api/listings`      | Get paginated listings with filtering |
| GET    | `/api/listings/{id}` | Get a single listing by id            |

---

### GET `/api/listings`

Returns a **paginated response** of listings.

#### Query Parameters

Pagination:

- `page` (int, default `0`)
- `size` (int, default `20`, max `100`)

Filtering:

- `location` (string, optional)
  - If a **5-digit ZIP code**, performs exact match on `zipCode`
  - Otherwise performs **case-insensitive partial match** on address
  - Blank or omitted → no location filtering
- `minPrice` (decimal)
- `maxPrice` (decimal)
- `minBeds` (int)
- `minBaths` (decimal)
- `minSqft` (int)
- `minEnergyStarScore` (int)

Sorting:

- `sortOption` (optional, enum-based)
- Default: `price ASC`

#### Validation Rules

- `minPrice <= maxPrice`
- All numeric fields must be ≥ 0

---

#### Example Request

macOS / Linux:

```bash
curl "http://localhost:8081/api/listings?page=0&size=10&minPrice=200000&maxPrice=500000&minBeds=3&minBaths=2"
```

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:8081/api/listings?page=0&size=10&minPrice=200000&maxPrice=500000&minBeds=3&minBaths=2"
```

#### Example: Search by Location

```bash
curl "http://localhost:8081/api/listings?location=15213&page=0&size=10"
```

---

#### Example Response (Paginated)

```json
{
  "content": [
    {
      "id": 1,
      "address": "77 Duff Rd, Pittsburgh, PA 15235",
      "price": 299900,
      "sqft": 1648,
      "beds": 3,
      "baths": 2,
      "listingUrl": "https://www.realtor.com/...",
      "photoUrls": ["https://...jpg"]
    }
  ],
  "totalElements": 120,
  "totalPages": 12,
  "size": 10,
  "number": 0
}
```

---

### GET `/api/listings/{id}`

Returns a single listing.

```bash
curl "http://localhost:8081/api/listings/1"
```

---

## Search Suggestions API

Provides autocomplete suggestions for search input.

### Endpoint

| Method | Path                        | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/listings/suggestions` | Get address and ZIP suggestions |

---

### GET `/api/listings/suggestions`

Returns a list of search suggestions based on a query string.

#### Query Parameters

- `q` (string, **required**) — search input
- `limit` (int, optional, default `5`) — max number of results

---

### Behavior

- Returns a mix of:
  - **Address suggestions**
  - **ZIP code suggestions**
- Address suggestions:
  - Include `listingId`
  - Include associated `zipCode`
- ZIP suggestions:
  - Only include ZIP values
- Results:
  - Prioritize **prefix matches**
  - Then include **partial matches**
  - Sorted alphabetically within groups

---

### Example Request

```bash
curl "http://localhost:8081/api/listings/suggestions?q=for"
```

---

## Favorites API

Endpoints for managing user favorites.

### Endpoints

| Method | Path                                        | Description                  |
| ------ | ------------------------------------------- | ---------------------------- |
| GET    | `/api/users/{userId}/favorites`             | Get all favorites for a user |
| POST   | `/api/users/{userId}/favorites`             | Add a favorite               |
| DELETE | `/api/users/{userId}/favorites/{listingId}` | Remove a favorite            |

---

### GET Favorites

```bash
curl "http://localhost:8081/api/users/1/favorites"
```

Returns:

```json
[
  {
    "userId": 1,
    "listingId": 42
  }
]
```

---

### POST Add Favorite

Request body:

```json
{
  "listingId": 42
}
```

```bash
curl -X POST http://localhost:8081/api/users/1/favorites \
  -H "Content-Type: application/json" \
  -d '{"listingId": 42}'
```

Returns `201 Created` with the favorite.

---

### DELETE Remove Favorite

```bash
curl -X DELETE http://localhost:8081/api/users/1/favorites/42
```

Returns `204 No Content`.

---

## Simple User Login API

Very simple email-based login endpoint used by the frontend.
If the email exists and password matches, it returns that user id.
If the email does not exist, it creates a new user row and returns the new id.

### Endpoint

| Method | Path               | Description                    |
| ------ | ------------------ | ------------------------------ |
| POST   | `/api/users/login` | Log in or create user by email |

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Example

```bash
curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Response

```json
{
  "id": 7
}
```

---

## Data Model

### Listings Table

```sql
CREATE TABLE listings (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  address TEXT NOT NULL,
  price NUMERIC(12,2),
  sqft INTEGER,
  beds INTEGER,
  baths DOUBLE PRECISION,
  energy_star_score INTEGER,
  listing_url TEXT,
  all_photo_urls TEXT
);
```

---

## Notes

- Uses DTOs (`ListingDTO`, `FavoriteDTO`) — entities are not exposed directly
- Supports dynamic filtering via `ListingSearchRequest`
- Pagination is handled via Spring Data `Page`
- Sorting is configurable via `SortOption`
- Validation is enforced at the request level
