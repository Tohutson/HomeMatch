import { test, expect } from "@playwright/test";
import { seedDatabase } from "./utils/seedDatabase";

test.describe("Listing details end-to-end", () => {
  test.beforeEach(() => {
    seedDatabase("seed-detail.sql");
  });

  test("loads a listing and supports the photo lightbox flow", async ({
    page,
  }) => {
    await page.goto("/listings/1");

    await expect(
      page.getByRole("heading", { name: "789 Lake View Dr" })
    ).toBeVisible();
    await expect(page.getByText("$615,000")).toBeVisible();
    await expect(page.getByText("4 bd")).toBeVisible();
    await expect(page.getByText("3.5 ba")).toBeVisible();
    await expect(page.getByRole("link", { name: "View original listing" })).toHaveAttribute(
      "href",
      "https://example.com/789-lake-view"
    );

    await page
      .getByRole("button", { name: "View property photo 2 full screen" })
      .click();

    const lightbox = page.getByRole("dialog", {
      name: "Property photo viewer",
    });

    await expect(lightbox).toBeVisible();
    await expect(lightbox.getByText("Photo 2 of 3")).toBeVisible();

    await page.getByRole("button", { name: "Next photo" }).click();
    await expect(lightbox.getByText("Photo 3 of 3")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
  });
});
