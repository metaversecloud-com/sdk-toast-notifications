// /scheduled-messages lists the toasts admins scheduled (stored in the world data object, keyed by
// profileId then jobId). Scheduling itself is disabled and the page isn't linked from the home page, but
// the route still serves it.
import { Page } from "@playwright/test";
import { expect, test, TopiaWorld } from "../../fixtures";
import { BUG } from "./bugs";

// The page fetches on mount, before App.tsx has set up the credentialed backendAPI (child effects run
// first), so it only works when reached from the home page inside the app, the way the (hidden) "View
// Scheduled Messages" button did. Open the app, then navigate client-side.
const openScheduledMessages = async (page: Page, world: TopiaWorld) => {
  await page.goto(world.url("/"));
  await expect(page.locator("h3")).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState({}, "", `/scheduled-messages${window.location.search}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "Scheduled Messages" })).toBeVisible();
};

test("lists every admin's scheduled messages, with author and time", async ({ page, world }) => {
  await world.seed({
    isAdmin: true,
    worldData: {
      messages: {
        [world.profileId]: {
          job1: {
            title: "Recess",
            message: "Ten minutes left",
            date_scheduled: "2030-01-15T10:30",
            displayName: "Ms. A",
          },
        },
        [world.scopedId("other-admin")]: {
          job2: { title: "Quiz", message: "Starts soon", date_scheduled: "2030-01-16T09:00", displayName: "Mr. B" },
        },
      },
    },
  });

  await openScheduledMessages(page, world);

  await expect(page.getByRole("heading", { name: "Recess" })).toBeVisible();
  await expect(page.getByText("Ten minutes left")).toBeVisible();
  await expect(page.getByText("By: Ms. A")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quiz" })).toBeVisible();
  await expect(page.getByText("By: Mr. B")).toBeVisible();
  // Stored in Pacific time, shown in the viewer's zone (UTC here): 10:30 PST is 18:30 UTC.
  await expect(page.getByText("Scheduled: Jan 15, 2030 at 6:30 PM")).toBeVisible();
});

test("shows an empty state when nothing is scheduled", async ({ page, world }) => {
  await world.seed({ isAdmin: true });

  await openScheduledMessages(page, world);

  await expect(page.getByText("No messages scheduled.")).toBeVisible();
});

test("the back arrow returns to the home page", async ({ page, world }) => {
  await world.seed({ isAdmin: true });
  await page.goto(world.url("/scheduled-messages"));

  await page.getByRole("button", { name: "Go back" }).click();

  await expect(page.getByRole("heading", { name: "Send a Notification to Users" })).toBeVisible();
});

test("players who aren't admins don't see other people's scheduled messages", async ({ page, world }) => {
  test.fail(true, BUG.nonAdminReadsMessages);
  await world.seed({
    isAdmin: false,
    worldData: {
      messages: {
        [world.scopedId("admin")]: {
          job1: { title: "Surprise quiz", message: "Shh", date_scheduled: "2030-01-15T10:30" },
        },
      },
    },
  });

  await openScheduledMessages(page, world);
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Surprise quiz")).toHaveCount(0);
});

test("opened directly, the page still loads the scheduled messages", async ({ page, world }) => {
  test.fail(true, BUG.scheduledPageNoCredentials);
  await world.seed({
    isAdmin: true,
    worldData: {
      messages: {
        [world.profileId]: { job1: { title: "Recess", message: "Soon", date_scheduled: "2030-01-15T10:30" } },
      },
    },
  });

  await page.goto(world.url("/scheduled-messages"));

  await expect(page.getByRole("heading", { name: "Recess" })).toBeVisible({ timeout: 2000 });
});
