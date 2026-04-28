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
    const nextButton = page.getByTestId("pagination-next");

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();
    await expect(nextButton).toBeEnabled();

    await page.getByPlaceholder("Max sqft").fill("1200");

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();
    await expect(nextButton).toBeEnabled();

    await page.getByRole("button", { name: /apply filters/i }).click();

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("Large House")).toHaveCount(0);
    await expect(page.getByText("Page 1 of 1")).toBeVisible();
    await expect(nextButton).toBeDisabled();
  });

  test("clears applied filters and restores unfiltered results", async ({
    page,
  }) => {
    await page.goto("/listings");
    const nextButton = page.getByTestId("pagination-next");

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(nextButton).toBeEnabled();

    await page.getByPlaceholder("Max sqft").fill("1200");
    await page.getByRole("button", { name: /apply filters/i }).click();

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("Large House")).toHaveCount(0);
    await expect(nextButton).toBeDisabled();

    await page.getByRole("button", { name: /clear/i }).click();

    await expect(page.getByText("Small House")).toBeVisible();
    await expect(page.getByText("2 matches")).toBeVisible();
    await expect(page.getByPlaceholder("Max sqft")).toHaveValue("");
    await expect(nextButton).toBeEnabled();

    await nextButton.click();
    await expect(page.getByText("Large House")).toBeVisible();
  });
});
