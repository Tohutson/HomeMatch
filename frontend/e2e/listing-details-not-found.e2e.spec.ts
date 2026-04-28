import { test, expect } from "@playwright/test";
import { seedDatabase } from "./utils/seedDatabase";

test.describe("Listing details not found end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-detail.sql");
  });

  test("shows the not found state for a missing listing id", async ({
    page,
  }) => {
    await page.goto("/listings/9999");

    await expect(
      page.getByRole("heading", { name: "Property not found" })
    ).toBeVisible();
    await expect(
      page.getByText("This property is no longer available in our database.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to browse" })).toHaveAttribute(
      "href",
      "/listings"
    );
  });
});
