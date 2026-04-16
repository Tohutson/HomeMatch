import { test, expect } from "@playwright/test";
import { seedDatabase } from "./utils/seedDatabase";

test.describe("Listing filters end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-filtering.sql");
  });

  test("does not apply draft filters until Apply Filters is clicked", async ({
    page,
  }) => {
    await page.goto("/listings");

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();

    await page.getByPlaceholder("Max sqft").fill("1200");

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();

    await page.getByRole("button", { name: /apply filters/i }).click();

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("1 match")).toBeVisible();
    await expect(page.getByText("Page 1 of 1")).toBeVisible();
  });

  test("clears applied filters and restores unfiltered results", async ({
    page,
  }) => {
    await page.goto("/listings");

    await expect(page.getByText("Small House")).toBeVisible();

    await page.getByPlaceholder("Max sqft").fill("1200");
    await page.getByRole("button", { name: /apply filters/i }).click();

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("1 match")).toBeVisible();

    await page.getByRole("button", { name: /clear/i }).click();

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();
    await expect(page.getByPlaceholder("Max sqft")).toHaveValue("");
  });
});
