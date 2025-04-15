# README Template

Please update the following in each of your SDK application.

## Introduction / Summary

This boilerplate is meant to give you a simple starting point to build new features in Topia using our Javascript SDK. Please reference the [documentation](https://metaversecloud-com.github.io/mc-sdk-js/index.html) for a more detailed breakdown of what the SDK is capable of and how to use it! This SDk application allows admins of a world to send announcements (Toasts) at a given time. They can also delete scheduled messages if they chose to.

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
            }`

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to server

### Add your .env environmental variables

```json
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [View it in action!](topia.io/appname-prod)
- To see an example of an on canvas turn based game check out TicTacToe:
  - (github))[https://github.com/metaversecloud-com/sdk-tictactoe]
  - (demo))[https://topia.io/tictactoe-prod]
