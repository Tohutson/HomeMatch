import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import path from "node:path";

function seedDatabase(fileName: string) {
  const sqlPath = path.resolve(__dirname, "../../backend/e2e", fileName);

  execSync(
    `PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d homematch_e2e -f "${sqlPath}"`,
    { stdio: "inherit" }
  );
}

test.describe("Listings end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-listings.sql");
  });

  test("loads listings from real backend and database", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("123 Main St")).toBeVisible();
  });
});
