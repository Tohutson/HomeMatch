import { execSync } from "node:child_process";
import path from "node:path";

export function seedDatabase(fileName: string): void {
  const sqlPath = path.resolve(__dirname, "../../../backend/e2e", fileName);

  execSync(
    `PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d homematch_e2e -f "${sqlPath}"`,
    { stdio: "inherit" }
  );
}
