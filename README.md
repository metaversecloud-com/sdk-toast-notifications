# Toast Notifications

## Introduction / Summary

Toast Notifications allows admins of a world to send announcements (Toasts) at a given time. Admins can send immediate toasts or schedule them for future delivery. They can also view and delete scheduled messages.

## Built With

### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

## Key Features

- An admin can send a toast immediately
- An admin can schedule toasts for a given time in the future
- An admin can schedule multiple toasts for the same time
- An admin can delete and view scheduled toasts

### Canvas elements & interactions

- Key Asset: When clicked this asset will open the drawer and allow users and admins to start interacting with the app.

### Drawer content

- Title and Message textfields to create the toast message
- "Send Now" button that will immediately send a toast
- Calender Scheduler to pick a date and time for a scheduled toast
- "Schedule Send" button that will schedule the toast at the given time
- "View Scheduled Messages" button that will bring the user to another page where they can view and delete scheduled messages

### Admin features

- Access: Click on the key asset to open the iframe and admins will be immediately recognized and see the view with the toast scheduler.
- Toast scheduler: Use the text fields, calender scheduler, and "Send Now" or "Schedule Send" buttons to send a toast to visitors in the world.
- Deletion: Click on the "View Scheduled Messages" button to view messages scheduled and there will be a red X button on each message that you can click to delete.

### Data objects

_We use data objects to store information about each implementation of the app per world._

- World: the data object attached to the world will store toast information for every instance of the app in a given world by visitorID followed by a unique job_id for each scheduled message.
  Structure of the world data object:

`[messages.${profileId}.${jobId}]: {
                title,
                message,
                date_scheduled,
                date_created,
                job_id,
                displayName,
            }`

## Environment Variables

Create a `.env` file in the root directory. See `.env-example` for a template.

| Variable               | Description                                                                        | Required |
| ---------------------- | ---------------------------------------------------------------------------------- | -------- |
| `NODE_ENV`             | Node environment                                                                   | No       |
| `SKIP_PREFLIGHT_CHECK` | Skip CRA preflight check                                                           | No       |
| `INSTANCE_DOMAIN`      | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging) | Yes      |
| `INTERACTIVE_KEY`      | Topia interactive app key                                                          | Yes      |
| `INTERACTIVE_SECRET`   | Topia interactive app secret                                                       | Yes      |

## Developers

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to server

### Add your .env environmental variables

See [Environment Variables](#environment-variables) above.

### Where to find INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
