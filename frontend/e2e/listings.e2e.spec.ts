import { test, expect } from "@playwright/test";
import { seedDatabase } from "./utils/seedDatabase";

test.describe("Listings end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-listings.sql");
  });

  test("loads listings from the real backend and database", async ({
    page,
  }) => {
    await page.goto("/listings");

    await expect(page.getByText("Filter homes faster")).toBeVisible();
    await expect(page.getByText("123 Main St")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();
    await expect(page.getByText("Page 1 of 1")).toBeVisible();
  });
});
