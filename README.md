# HomeMatch

HomeMatch is a real estate home browser web application that enables users to efficiently explore and compare residential properties through intelligent search, filtering, and personalized browsing features.

## Running the Frontend (Local Development)

### 1. Install Volta (if not already installed)

Volta ensures the correct Node version is used automatically:
**Mac / Linux**

```bash
curl https://get.volta.sh | bash
```

**Windows (using Winget)**

```powershell
winget install Volta.Volta
```

- After installation, restart your terminal or PowerShell.
- Volta will automatically use the Node version pinned in the repo.

### 2. Clone the repository (if not done yet)

```bash
git clone https://github.com/Tohutson/HomeMatch.git
cd HomeMatch/frontend
```

### 3. Install dependencies

Volta will automatically use the pinned Node version from the repo:

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## Running the Backend (Local Development)

### Local Development Strategy

This project uses a **hybrid Docker approach** for local development:

- PostgreSQL runs inside a Docker container
- The Spring Boot backend runs locally via Maven
- This ensures consistent infrastructure while allowing full IDE debugging support

This approach provides a reproducible database environment without requiring developers to install PostgreSQL directly on their machines.

### Prerequisites

Before starting, ensure you have the following installed:

- Docker Desktop (or Docker Engine)
- JDK 25
- Maven 3.9+
- Git

Verify installations:

```bash
java --version
mvn --version
docker --version
```

---

### 1. Setup Environment Variables

macOS / Linux (temporary for current terminal session)

```bash
export DB_USERNAME=homefinder
export DB_PASSWORD=supersecret
```

Then run your app in the same terminal session.

Windows (PowerShell, temporary)

```powershell
$env:DB_USERNAME="homefinder"
$env:DB_PASSWORD="supersecret"
```

#### Notes

These environment variables are temporary — they last only for the current terminal session.

To make them permanent, add them to your shell profile (~/.bashrc, ~/.zshrc, or Windows environment variables).

Always set these before starting Docker containers or running the backend.

### 2. Start PostgreSQL (Docker)

From the project root directory:

```bash
docker-compose up -d
```

This will:

- Pull the PostgreSQL image (if not already downloaded)
- Start the database container
- Expose PostgreSQL on port `5433`

To confirm the container is running:

```bash
docker ps
```

You should see the database container listed.

To stop the database:

```bash
docker-compose down
```

To completely reset the database (including stored data):

```bash
docker-compose down -v
```

### 3. Database Configuration (Dev Profile)

The backend connects to PostgreSQL using the dev profile (application-dev.yml) with environment variables:

```yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/homefinder
    username: ${DB_USERNAME:homefinder} # fallback to 'homefinder' if env var not set
    password: ${DB_PASSWORD:supersecret} # fallback to 'supersecret' if env var not set
  jpa:
    hibernate:
      ddl-auto: update
```

Notes:

Using ${DB_USERNAME} and ${DB_PASSWORD} ensures Docker and your local dev environment use the same credentials.

You can still override them via environment variables if needed.

IDE run configurations can also set spring.profiles.active=dev to pick up this file automatically.

### 4. Run the Backend

From the project root:

```bash
cd backend
```

Start the application with the dev profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Alternatively, run the application directly from your IDE.

By default, the backend will start on:

```text
http://localhost:8081
```

### 5. Verify Startup

On successful startup, you should see logs similar to:

```text
Started Application in X.XXX seconds
```

If `spring.jpa.hibernate.ddl-auto=update` is enabled, database tables will be created automatically on first run.

---

### Troubleshooting

#### Port 5433 Already in Use

Another PostgreSQL instance may be running locally.
Stop the local instance or change the Docker port mapping.

#### Cannot Connect to Database

Ensure:

- Docker container is running (`docker ps`)
- Database credentials are set in environment variables
- Port 5433 is not blocked
