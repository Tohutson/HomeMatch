# HomeMatch Backend

Spring Boot backend for HomeMatch, connected to a shared Supabase PostgreSQL database.

## Prerequisites

- JDK 25+
- Git

Check Java version:

```bash
java --version
```

## Team Setup (One-Time)

Get the shared `.env` file from the team owner and place it in:

- `HomeMatch/.env`

Notes:

- Teammates do not need their own Supabase account.
- Do not commit `.env` to git.

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

Backend default URL:

```text
http://localhost:8081
```

## API Documentation

Base URL:

```text
http://localhost:8081
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/properties` | List properties with optional filters |
| GET | `/api/properties/{id}` | Get one property by id |

### GET `/api/properties`

Returns a JSON array of properties.

Query parameters:

- `limit` integer, optional, default `50`, range `1-200`
- `maxPrice` decimal, optional
- `minBeds` integer, optional
- `minBaths` decimal, optional

PowerShell example:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:8081/api/properties?limit=20&maxPrice=350000&minBeds=3&minBaths=2.0"
```

macOS / Linux example:

```bash
curl "http://localhost:8081/api/properties?limit=20&maxPrice=350000&minBeds=3&minBaths=2.0"
```

### GET `/api/properties/{id}`

Returns one property JSON object when found.

PowerShell example:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:8081/api/properties/1"
```

macOS / Linux example:

```bash
curl "http://localhost:8081/api/properties/1"
```

### Response Model

Each property object includes:

- `id` number
- `address` string
- `price` number or null
- `sqft` number or null
- `beds` number or null
- `baths` number or null
- `listingUrl` string or null
- `photo1` string or null
- `photo2` string or null
- `photo3` string or null
- `photo4` string or null
- `photo5` string or null
- `allPhotoUrls` string or null

Example response item:

```json
{
  "id": 1,
  "address": "77 Duff Rd, Pittsburgh, PA 15235",
  "price": 299900,
  "sqft": 1648,
  "beds": 3,
  "baths": 2,
  "listingUrl": "https://www.realtor.com/realestateandhomes-detail/...",
  "photo1": "https://...jpg",
  "photo2": null,
  "photo3": null,
  "photo4": null,
  "photo5": null,
  "allPhotoUrls": "https://...jpg | https://...jpg"
}
```

### Create Table In Supabase

The backend entity maps to table `listings`.

```sql
CREATE TABLE listings (
  id BIGINT PRIMARY KEY,
  address TEXT NOT NULL,
  price NUMERIC,
  sqft NUMERIC,
  beds INTEGER,
  baths NUMERIC,
  listing_url TEXT,
  photo_1 TEXT,
  photo_2 TEXT,
  photo_3 TEXT,
  photo_4 TEXT,
  photo_5 TEXT,
  all_photo_urls TEXT
);
```
