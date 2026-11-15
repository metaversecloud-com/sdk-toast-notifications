// The admin form on the home page: an admin types a title and a message and "Send Now" fires a toast to
// everyone in the world (World.fireToast). Non-admins see nothing.
import { Page } from "@playwright/test";
import { expect, test, TopiaWorld } from "../../fixtures";
import { BUG } from "./bugs";

const openAsAdmin = async (page: Page, world: TopiaWorld) => {
  await world.seed({ isAdmin: true });
  await page.goto(world.url("/"));
  await expect(page.getByRole("heading", { name: "Send a Notification to Users" })).toBeVisible();
};

const fill = async (page: Page, title: string, message: string) => {
  await page.getByLabel("Notification Title").fill(title);
  await page.getByLabel("Notification Message").fill(message);
};

test("an admin sends a notification to everyone in the world", async ({ page, world }) => {
  await openAsAdmin(page, world);

  await fill(page, "Class is Ending", "Please be ready to leave in 5 minutes!");
  await page.getByRole("button", { name: "Send Now" }).click();

  await expect(page.getByText("Your message was sent!")).toBeVisible();
  expect(await world.events("world-toast")).toEqual([
    expect.objectContaining({ title: "Class is Ending", text: "Please be ready to leave in 5 minutes!" }),
  ]);
  // The form is cleared for the next notification.
  await expect(page.getByLabel("Notification Title")).toHaveValue("");
  await expect(page.getByLabel("Notification Message")).toHaveValue("");
});

test("sending records the notifications_sent analytic", async ({ page, world }) => {
  await openAsAdmin(page, world);

  await fill(page, "Hi", "There");
  await page.getByRole("button", { name: "Send Now" }).click();
  await expect(page.getByText("Your message was sent!")).toBeVisible();

  await expect
    .poll(() => world.events("analytics"))
    .toContainEqual(
      expect.objectContaining({
        analyticName: "notifications_sent",
        uniqueKey: world.profileId,
        urlSlug: world.urlSlug,
      }),
    );
});

test("a title and a message are both required", async ({ page, world }) => {
  await openAsAdmin(page, world);

  await page.getByRole("button", { name: "Send Now" }).click();
  await expect(page.getByText("Please enter a title before sending immediately.")).toBeVisible();
  await expect(page.getByText("Please enter a message before sending immediately.")).toBeVisible();

  await page.getByLabel("Notification Title").fill("Only a title");
  await page.getByRole("button", { name: "Send Now" }).click();
  await expect(page.getByText("Please enter a message before sending immediately.")).toBeVisible();
  await expect(page.getByText("Please enter a title before sending immediately.")).toHaveCount(0);

  expect(await world.events("world-toast")).toEqual([]);
  await expect(page.getByText("Your message was sent!")).toHaveCount(0);
});

test("typing clears the field's error", async ({ page, world }) => {
  await openAsAdmin(page, world);
  await page.getByRole("button", { name: "Send Now" }).click();
  await expect(page.getByText("Please enter a title before sending immediately.")).toBeVisible();

  await page.getByLabel("Notification Title").fill("x");

  await expect(page.getByText("Please enter a title before sending immediately.")).toHaveCount(0);
  await expect(page.getByText("Please enter a message before sending immediately.")).toBeVisible();
});

test("the title stops at 40 characters and the message at 140, with live counters", async ({ page, world }) => {
  await openAsAdmin(page, world);
  await expect(page.getByText("0/40")).toBeVisible();
  await expect(page.getByText("0/140")).toBeVisible();

  await fill(page, "t".repeat(60), "m".repeat(200));

  await expect(page.getByLabel("Notification Title")).toHaveValue("t".repeat(40));
  await expect(page.getByLabel("Notification Message")).toHaveValue("m".repeat(140));
  await expect(page.getByText("40/40")).toBeVisible();
  await expect(page.getByText("140/140")).toBeVisible();

  await page.getByRole("button", { name: "Send Now" }).click();
  await expect(page.getByText("Your message was sent!")).toBeVisible();
  expect(await world.events("world-toast")).toEqual([
    expect.objectContaining({ title: "t".repeat(40), text: "m".repeat(140) }),
  ]);
});

test("a double click while sending fires the notification once", async ({ page, world }) => {
  await world.seed({ isAdmin: true, delays: { "/fire-toast": 600 } });
  await page.goto(world.url("/"));
  await fill(page, "Once", "Only once");
  const send = page.getByRole("button", { name: "Send Now" });

  await send.click();
  await expect(send).toBeDisabled();
  await send.click({ force: true });

  await expect(page.getByText("Your message was sent!")).toBeVisible();
  await expect(send).toBeEnabled();
  expect(await world.events("world-toast")).toHaveLength(1);
});

test("players who aren't admins see no form", async ({ page, world }) => {
  await world.seed({ isAdmin: false });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Nothing to see here!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send Now" })).toHaveCount(0);
  await expect(page.getByLabel("Notification Title")).toHaveCount(0);
});

test("opened outside Topia (no credentials) the page shows no form", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Nothing to see here!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send Now" })).toHaveCount(0);
});

test("opening the app records a start for the player", async ({ page, world }) => {
  await world.seed({ isAdmin: false });
  await page.goto(world.url("/"));
  await expect(page.getByRole("heading", { name: "Nothing to see here!" })).toBeVisible();

  await expect
    .poll(() => world.events("analytics"))
    .toContainEqual(
      expect.objectContaining({ analyticName: "starts", profileId: world.profileId, urlSlug: world.urlSlug }),
    );
});

test("starts_admin is recorded for admins", async ({ page, world }) => {
  test.fail(true, BUG.startsAdminInverted);
  await openAsAdmin(page, world);

  await expect
    .poll(() => world.events("analytics"), { timeout: 2000 })
    .toContainEqual(expect.objectContaining({ analyticName: "starts_admin" }));
});

test("starts_admin is not recorded for players who aren't admins", async ({ page, world }) => {
  test.fail(true, BUG.startsAdminInverted);
  await world.seed({ isAdmin: false });
  await page.goto(world.url("/"));
  await expect(page.getByRole("heading", { name: "Nothing to see here!" })).toBeVisible();
  await expect
    .poll(() => world.events("analytics"))
    .toContainEqual(expect.objectContaining({ analyticName: "starts" }));

  expect(await world.events("analytics")).not.toContainEqual(expect.objectContaining({ analyticName: "starts_admin" }));
});

test("opening the app as an admin loads the visitor once", async ({ page, world }) => {
  test.fail(true, BUG.visitorFetchedTwice);
  const visitorCalls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/visitor") visitorCalls.push(request.url());
  });

  await openAsAdmin(page, world);
  await page.waitForLoadState("networkidle");

  expect(visitorCalls).toHaveLength(1);
});

test("when Topia fails to fire the toast the admin is told, not shown a success", async ({ page, world }) => {
  test.fail(true, BUG.fireToastErrorSwallowed);
  await world.seed({ isAdmin: true, failures: { "/fire-toast": 500 } });
  await page.goto(world.url("/"));
  await fill(page, "Lost", "Nobody will see this");

  await page.getByRole("button", { name: "Send Now" }).click();

  await expect(page.locator(".text-error")).toBeVisible();
  await expect(page.getByText("Your message was sent!")).toHaveCount(0);
});
