# HomeMatch

HomeMatch is a real estate home browser web application that enables users to efficiently explore and compare residential properties through intelligent search, filtering, and personalized browsing features.

---

### Prerequisites

Before starting, ensure you have the following installed:

- JDK 25
- Maven 3.9+
- Git
- Volta

Verify installations:

```bash
java --version
mvn --version
git --version
volta --version
```

---

### Development

### Development

- For guidelines on contributing, see [CONTRIBUTING.md](./CONTRIBUTING.md)
- For backend instructions, see [Backend README](./backend/README.md)
- For frontend instructions, see [Frontend README](./frontend/README.md)
- For local end-to-end testing, start the disposable Postgres database with `docker compose -f docker-compose.e2e.yml up -d`, run the backend with `./mvnw spring-boot:run -Dspring-boot.run.profiles=e2e`, and then run the frontend Playwright suite from `frontend` with `npm run test:e2e`.
