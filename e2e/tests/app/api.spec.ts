// Server rules of the API routes, called the way a player's iframe (or anyone holding its credentials)
// can call them directly.
import { INTERACTIVE_SECRET } from "../../constants";
import { expect, test } from "../../fixtures";
import { withPrivateServer } from "../../helpers/privateServer";
import { BUG } from "./bugs";

const post = (baseURL: string, path: string, data: unknown) =>
  fetch(`${baseURL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

test.describe("POST /api/world/fire-toast", () => {
  // Not in CREDENTIALED_ROUTES: with bad credentials the route's un-awaited analytics write rejects and
  // takes the process down, and only the missing-credentials platform test can run on a private server.
  test("rejects a request without session credentials", async ({ world }) => {
    test.slow();
    await world.seed();

    const { result, alive } = await withPrivateServer(async (baseURL) => {
      const response = await post(baseURL, "/api/world/fire-toast", { title: "Hi", text: "There" });
      return { status: response.status, body: await response.json() };
    });

    test.fail(true, BUG.unawaitedAnalyticsCrash);
    expect(alive, "the app process exited").toBe(true);
    expect(result!.status).toBeGreaterThanOrEqual(400);
    expect(result!.body.success).toBe(false);
  });

  test("rejects credentials signed for another app's public key", async ({ world }) => {
    test.slow();
    await world.seed({ isAdmin: true });
    const path = `/api/world/fire-toast?${world.credentials({ interactivePublicKey: "someone-else" })}`;

    const { result, alive } = await withPrivateServer(async (baseURL) => {
      const response = await post(baseURL, path, { title: "Hi", text: "There" });
      return { status: response.status, body: await response.json() };
    });

    test.fail(true, BUG.unawaitedAnalyticsCrash);
    expect(alive, "the app process exited").toBe(true);
    expect(result!.status).toBeGreaterThanOrEqual(400);
    expect(result!.body.success).toBe(false);
    expect(await world.events("world-toast")).toEqual([]);
  });

  test("never returns the interactive secret or a signed JWT", async ({ request, world }) => {
    await world.seed({ isAdmin: true });

    const response = await request.post(world.api("/world/fire-toast"), { data: { title: "Hi", text: "There" } });

    expect(response.ok()).toBe(true);
    const body = await response.text();
    for (const marker of [INTERACTIVE_SECRET, "interactiveSecret", "InteractiveJWT"])
      expect(body).not.toContain(marker);
  });

  test("a player who isn't an admin can't toast the whole world", async ({ request, world }) => {
    test.fail(true, BUG.nonAdminCanFireToast);
    await world.seed({ isAdmin: false });

    const response = await request.post(world.api("/world/fire-toast"), {
      data: { title: "FREE PIZZA", text: "Everyone go to the lobby now" },
    });

    expect(response.ok()).toBe(false);
    expect(await world.events("world-toast")).toEqual([]);
  });

  test("an admin's toast goes through the API too", async ({ request, world }) => {
    await world.seed({ isAdmin: true });

    const response = await request.post(world.api("/world/fire-toast"), { data: { title: "Hi", text: "There" } });

    expect(response.ok()).toBe(true);
    expect(await world.events("world-toast")).toEqual([expect.objectContaining({ title: "Hi", text: "There" })]);
  });

  for (const [name, data] of [
    ["an empty title and text", { title: "", text: "" }],
    ["no body at all", {}],
    ["a title over 40 characters", { title: "t".repeat(41), text: "ok" }],
    ["a message over 140 characters", { title: "ok", text: "m".repeat(5000) }],
  ] as const) {
    test(`rejects ${name}`, async ({ request, world }) => {
      test.fail(true, BUG.noServerValidation);
      await world.seed({ isAdmin: true });

      const response = await request.post(world.api("/world/fire-toast"), { data });

      expect(response.ok()).toBe(false);
      expect(await world.events("world-toast")).toEqual([]);
    });
  }

  test("answers an error when Topia fails to fire the toast", async ({ request, world }) => {
    test.fail(true, BUG.fireToastErrorSwallowed);
    await world.seed({ isAdmin: true, failures: { "/fire-toast": 500 } });

    const response = await request.post(world.api("/world/fire-toast"), { data: { title: "Hi", text: "There" } });

    expect(await world.events("injected-failure")).toContainEqual(expect.objectContaining({ status: 500 }));
    expect(response.ok()).toBe(false);
    expect((await response.json()).success).toBe(false);
  });

  test("a failing analytics write doesn't take the server down", async ({ world }) => {
    test.slow();
    await world.seed({ isAdmin: true, failures: { "/update-data-object": 500 } });
    const path = `/api/world/fire-toast?${world.credentials()}`;

    const { result, alive } = await withPrivateServer(async (baseURL) => {
      const response = await post(baseURL, path, { title: "Hi", text: "There" });
      return response.status;
    });

    expect(result).toBe(200);
    expect(await world.events("world-toast")).toHaveLength(1);
    test.fail(true, BUG.unawaitedAnalyticsCrash);
    expect(alive, "the app process exited").toBe(true);
  });
});

test.describe("GET /api/visitor", () => {
  test("tells the page whether the player is an admin", async ({ request, world }) => {
    await world.seed({ isAdmin: true });
    expect(await (await request.get(world.api("/visitor"))).json()).toEqual({
      visitor: { isAdmin: true },
      success: true,
    });

    await world.updateVisitor({ isAdmin: false });
    expect(await (await request.get(world.api("/visitor"))).json()).toEqual({
      visitor: { isAdmin: false },
      success: true,
    });
  });

  test("a failing analytics write doesn't take the server down", async ({ world }) => {
    test.slow();
    await world.seed({ isAdmin: true, failures: { "/update-data-object": 500 } });
    const path = `/api/visitor?${world.credentials()}`;

    const { result, alive } = await withPrivateServer(async (baseURL) => {
      const response = await fetch(`${baseURL}${path}`);
      return response.status;
    });

    expect(result).toBe(200);
    test.fail(true, BUG.unawaitedAnalyticsCrash);
    expect(alive, "the app process exited").toBe(true);
  });
});

test.describe("scheduled messages (disabled)", () => {
  test("scheduling a toast is refused and stores nothing", async ({ request, world }) => {
    await world.seed({ isAdmin: true });

    const response = await request.post(world.api("/world/handle-schedule-toast"), {
      data: { title: "Later", message: "In five minutes", date_scheduled: "2030-01-01T10:00" },
    });

    expect(response.status()).toBe(500);
    expect(await response.json()).toMatchObject({ success: false, error: "This functionality is not yet available" });
    expect((await world.state()).dataObject).toEqual({});
  });

  test("deleting a scheduled toast is refused and keeps it", async ({ request, world }) => {
    const messages = {
      [world.profileId]: { job1: { title: "Later", message: "Soon", date_scheduled: "2030-01-01T10:00" } },
    };
    await world.seed({ isAdmin: true, worldData: { messages } });

    const response = await request.post(world.api("/world/handle-delete-toast"), { data: { jobId: "job1" } });

    expect(response.status()).toBe(500);
    expect(await response.json()).toMatchObject({ success: false, error: "this functionality is not yet available" });
    expect((await world.state()).dataObject).toEqual({ messages });
  });

  test("an admin can read the world's scheduled messages", async ({ request, world }) => {
    const messages = { [world.profileId]: { job1: { title: "Later", message: "Soon" } } };
    await world.seed({ isAdmin: true, worldData: { messages } });

    const response = await request.get(world.api("/world/handle-get-toasts"));

    expect(await response.json()).toEqual({ savedData: { messages }, success: true });
  });

  test("a player who isn't an admin can't read them", async ({ request, world }) => {
    test.fail(true, BUG.nonAdminReadsMessages);
    const messages = { [world.profileId]: { job1: { title: "Later", message: "Soon", displayName: "Teacher" } } };
    await world.seed({ isAdmin: false, worldData: { messages } });

    const response = await request.get(world.api("/world/handle-get-toasts"));

    expect(response.ok()).toBe(false);
    expect(await response.text()).not.toContain("Teacher");
  });
});
