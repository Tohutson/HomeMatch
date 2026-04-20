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

  test("applies supported sort options using the real backend contract", async ({
    page,
  }) => {
    await page.goto("/listings");

    const activeCard = page.getByTestId("listing-card");
    const sortSelect = page.getByLabel("Sort Results");

    await expect(activeCard.getByText("123 Main St")).toBeVisible();

    await sortSelect.selectOption("PRICE_DESC");
    await expect(activeCard.getByText("456 Oak Ave")).toBeVisible();

    await sortSelect.selectOption("SQFT_ASC");
    await expect(activeCard.getByText("123 Main St")).toBeVisible();

    await sortSelect.selectOption("ENERGY_DESC");
    await expect(activeCard.getByText("123 Main St")).toBeVisible();
  });
});
