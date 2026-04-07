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

test.describe("Pagination end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-pagination.sql");
  });

  test("advances through listings and eventually reaches the next backend page", async ({
    page,
  }) => {
    await page.goto("/");

    const nextButton = page.getByTestId("pagination-next");

    const pageOneListings = [
      "Page 1 Listing A",
      "Page 1 Listing B",
      "Page 1 Listing C",
      "Page 1 Listing D",
      "Page 1 Listing E",
      "Page 1 Listing F",
      "Page 1 Listing G",
      "Page 1 Listing H",
      "Page 1 Listing I",
      "Page 1 Listing J",
      "Page 1 Listing K",
      "Page 1 Listing L",
    ];

    await expect(page.getByText(pageOneListings[0])).toBeVisible();

    for (let i = 1; i < pageOneListings.length; i++) {
      await nextButton.click();
      await expect(page.getByText(pageOneListings[i])).toBeVisible();
    }

    await nextButton.click();
    await expect(page.getByText("Page 2 Listing A")).toBeVisible({
      timeout: 15000,
    });
  });
});
