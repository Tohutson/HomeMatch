import { test, expect } from "@playwright/test";
import { seedDatabase } from "./utils/seedDatabase";

test.describe("Listings end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-listings.sql");
  });

  test("loads listings from the real backend and database", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("123 Main St")).toBeVisible();
    await expect(page.getByText(/\d+ match(es)?/i)).toBeVisible();
  });
});
