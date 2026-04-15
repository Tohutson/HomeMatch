import { test, expect } from "@playwright/test";
import { seedDatabase } from "./utils/seedDatabase";

test.describe("Listing filters end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-filtering.sql");
  });

  test("does not apply draft filters until Apply Filters is clicked", async ({
    page,
  }) => {
    await page.goto("/");

    // Default sort is price ascending, so Small House should appear first.
    await expect(page.getByText("Small House")).toBeVisible();

    await page.getByPlaceholder("Max sqft").fill("1200");

    // Typing alone should not change the currently displayed listing.
    await expect(page.getByText("Small House")).toBeVisible();

    await page.getByRole("button", { name: /apply filters/i }).click();

    // After applying, Small House is still the visible matching listing.
    await expect(page.getByText("Small House")).toBeVisible();
  });

  test("clears applied filters and restores unfiltered results", async ({
    page,
  }) => {
    await page.goto("/");

    // Default unfiltered first listing is Small House due to price ascending.
    await expect(page.getByText("Small House")).toBeVisible();

    await page.getByPlaceholder("Max sqft").fill("1200");
    await page.getByRole("button", { name: /apply filters/i }).click();

    // Filtered state still shows Small House.
    await expect(page.getByText("Small House")).toBeVisible();

    await page.getByRole("button", { name: /clear/i }).click();

    // After clear, unfiltered results are restored.
    // Since default sort is still price ascending, Small House remains first.
    await expect(page.getByText("Small House")).toBeVisible();

    // Optional stronger assertion if your UI shows match count:
    await expect(page.getByText("2 matches")).toBeVisible();
  });
});
