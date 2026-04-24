import { test, expect } from "@playwright/test";

const userOneEmail = process.env.E2E_AUTH_EMAIL_ONE;
const userOnePassword = process.env.E2E_AUTH_PASSWORD_ONE;
const userTwoEmail = process.env.E2E_AUTH_EMAIL_TWO;
const userTwoPassword = process.env.E2E_AUTH_PASSWORD_TWO;

test("redirects unauthenticated users from favorites to login", async ({
  page,
}) => {
  await page.goto("/favorites");

  await expect(page).toHaveURL((url) => {
    return url.pathname === "/login" && url.searchParams.get("next") === "/favorites";
  });
});

test.describe("real auth flow", () => {
  test.skip(
    !userOneEmail || !userOnePassword || !userTwoEmail || !userTwoPassword,
    "E2E auth credentials are not configured",
  );

  test("keeps favorites isolated across two authenticated users", async ({
    page,
  }) => {
    await login(page, userOneEmail!, userOnePassword!);
    await page.goto("/listings");

    const createFavoriteResponse = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/users/me/favorites") &&
        response.request().method() === "POST" &&
        (response.status() === 201 || response.status() === 409)
      );
    });

    await page.getByTestId("favorite-button").first().click();
    await createFavoriteResponse;

    await page.goto("/favorites");
    await expect(page.getByRole("main").getByText("1 saved home")).toBeVisible();
    await page.getByTestId("logout-button").click();

    await login(page, userTwoEmail!, userTwoPassword!);
    await page.goto("/favorites");
    await expect(page.getByText("Start building your shortlist")).toBeVisible();
  });
});

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.locator("form").getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/favorites$|\/listings$|\/profile$|\/$/);
}
