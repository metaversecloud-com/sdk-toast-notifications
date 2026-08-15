<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Toast Notifications

## Introduction / Summary

Toast Notifications is a lightweight admin-broadcast app for Topia worlds. An admin clicks the app's key asset to open a drawer, types a title and a short message, and hits **Send Now** — the SDK's `world.fireToast()` fans a toast out to **every visitor currently in the world**. Non-admins who open the drawer see nothing to interact with.

## Key Features

- Admin-only composer inside the drawer (Title + Message textarea).
- Live character counters: **title 40 chars**, **message 140 chars**.
- One-click broadcast to every visitor in the world via `world.fireToast({ title, text })`.
- Non-admin visitors who open the drawer see a "Nothing to see here!" placeholder.
- Success confirmation with a 🎉 in the UI on send.
- Dormant scheduling code path: cron-backed queue, per-admin message list, delete button on scheduled cards, and a `/scheduled-messages` route (kept in the repo, disabled at HEAD).

## Required Assets with Unique Names

**None.** The key asset is identified by `credentials.assetId` (the asset the visitor clicked), not by unique name. `uniqueName` is passed through the interactive params and forwarded on to backend calls but the server never filters on it.

## Technical Architecture

### Data Objects

#### World

`world.fireToast()` itself does not persist anything. The only write to the world data object today is a no-op `updateDataObject({}, { analytics: [...] })` inside `handleFireToast`, used purely to fire the `notifications_sent` analytic — the app produces no user-visible world state at HEAD.

The dormant scheduling flow would populate the world data object under `messages.{profileId}.{jobId}` (see `server/types/WorldDataObjectType.ts` and `handleSetDataObject.ts`). The intended shape:

```ts
{
  messages?: {
    [profileId: string]: {
      [jobId: string]: {
        title: string;
        message: string;
        date_scheduled: string;   // "yyyy-MM-dd'T'HH:mm" in America/Los_Angeles
        date_created: string;     // same format
        job_id: string;           // crypto.randomUUID()
        displayName: string;
      };
    };
  };
}
```

Cron jobs are kept in an in-process `scheduledJobs: Record<string, cron.ScheduledTask>` — they do **not** survive a server restart.

#### Visitor

No visitor data object is written. `handleGetVisitor` reads `isAdmin` from the SDK and fires visitor-scoped analytics via a no-op `updateDataObject({}, { analytics: [...] })`.

## API Endpoints

All routes are mounted under `/api`.

| Method | Route                          | Status   | Description                                                                                                                                |
| ------ | ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/`                            | Live     | Hello ping.                                                                                                                                |
| `GET`  | `/system/health`               | Live     | Version, server start date, and `NODE_ENV` / `INSTANCE_DOMAIN` / `INTERACTIVE_KEY` / `S3_BUCKET`.                                          |
| `GET`  | `/visitor`                     | Live     | Returns `{ visitor: { isAdmin } }`. Fires `starts` (and `starts_admin` — see Analytics).                                                   |
| `POST` | `/world/fire-toast`            | Live     | Body: `{ title, text }`. Broadcasts a toast to every visitor in the world. Fires `notifications_sent`.                                     |
| `POST` | `/world/handle-schedule-toast` | Disabled | Body: `{ title, message, date_scheduled }`. Throws "not yet available" before doing anything.                                              |
| `POST` | `/world/handle-delete-toast`   | Disabled | Body: `{ jobId }`. Throws "not yet available" before doing anything.                                                                       |
| `GET`  | `/world/handle-get-toasts`     | Live     | Returns the full world data object under `{ savedData, success: true }`. Consumed by the (unreachable at HEAD) `/scheduled-messages` page. |

Every route runs `getCredentials(req.query)`, which requires `interactiveNonce`, `interactivePublicKey`, `urlSlug`, `visitorId` and validates `interactivePublicKey === process.env.INTERACTIVE_KEY`.

## Analytics

Public-key analytics only — no Google Sheets or external sinks.

| Event                | Fired when                              | Where                                    |
| -------------------- | --------------------------------------- | ---------------------------------------- |
| `starts`             | Any visitor loads the app (`/visitor`). | `handleGetVisitor.ts`                    |
| `starts_admin`       | Same call, when `isAdmin` is **false**. | `handleGetVisitor.ts` (see caveat below) |
| `notifications_sent` | Admin clicks **Send Now**.              | `handleFireToast.ts`                     |

> **Caveat:** the `starts_admin` block is guarded by `if (!isAdmin)`, so despite the name it fires on non-admin loads. Recorded here as-is at HEAD.

All three are written via `entity.updateDataObject({}, { analytics: [{ analyticName, uniqueKey: profileId }] })` — the empty first arg means no data-object mutation, the call is used purely to increment the analytic.

## Environment Variables

Create a `.env` file in the app root. See `.env-example` for a template. `INTERACTIVE_KEY` and `INTERACTIVE_SECRET` are the only variables enforced by the startup check in `server/index.ts`.

| Variable             | Description                                                                                                                                     | Required |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`    | Topia interactive app key. Must match the `interactivePublicKey` sent by the iframe.                                                            | Yes      |
| `INTERACTIVE_SECRET` | Topia interactive app secret.                                                                                                                   | Yes      |
| `INSTANCE_DOMAIN`    | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging). Defaults to `api.topia.io`.                                 | No       |
| `INSTANCE_PROTOCOL`  | `https` for production/staging, `http` only for local. Defaults to `https`.                                                                     | No       |
| `PORT`               | Server port. Defaults to `3000`.                                                                                                                | No       |
| `NODE_ENV`           | `development` enables permissive CORS for `localhost:3000` / `localhost:5173`; anything else serves the built React client from `client/build`. | No       |
| `S3_BUCKET`          | Surfaced in `/system/health` only. Not read anywhere else in the app.                                                                           | No       |

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

```bash
# from the app root
npm install
cd client && npm install && cd ..

# copy the template and fill in your keys
cp .env-example .env

# run client + server together (uses concurrently)
npm run dev
```

- Client dev server: Vite on `http://localhost:5173`
- API server: Express on `http://localhost:${PORT}` (default `3000`)

For a production-style build: `npm run build` (builds both workspaces) then `npm start` (serves the built React app from Express).

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Delivery is world-wide only.** There is no targeting by proximity, role, section, or asset — every visitor in the world sees the toast the moment the admin clicks Send Now.
- **Payload is text-only.** `world.fireToast({ title, text })` accepts no image, icon, action button, or href. The message is a plain string capped client-side at 140 characters.
- **Character limits are enforced client-side only.** The server does not re-validate `title` / `text` length.
- **Scheduling is dormant.** `handleSetDataObject.ts` and `handleDeleteToast.ts` short-circuit with a thrown string on line one. If you re-enable them, note that (a) the cron scheduler is in-process only and drops all jobs on restart, (b) all times are recorded in `America/Los_Angeles`, and (c) the `/scheduled-messages` client route is currently commented out of `Home.tsx`.
- **CRA/Tailwind mix.** The client uses Vite but the repo still carries `SKIP_PREFLIGHT_CHECK`-style boilerplate in older docs — it is not read at HEAD. Tailwind is present but most primary UI uses SDK CSS classes (`input`, `btn`, `label`, `input-char-count`, `text-error`, `text-success`).
- **Response cleaner.** `cleanReturnPayload` runs on every `res.send` and strips out any accidentally-leaked credentials before responding.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [Notion One Pager](https://app.notion.com/p/topiaio/Toast-notification-1d040e35bdb98055b728ed593a8f54ad?v=71f6c3828d3b4f33960326f9bde24781)
