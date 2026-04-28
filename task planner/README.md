# My Task Planner

A personal task planner with a polished frontend, Node.js backend, persistent database storage, and deployment-ready scripts.

## What It Does

My Task Planner helps you create, search, update, complete, and delete everyday tasks.

## Features

- Login is mandatory with email and password before any task data is shown.
- Signup creates a private empty planner with full name, gender, phone number, email, and password.
- Forgot/reset password using email and phone number.
- Profile details for full name, gender, phone number, and email.
- Add tasks with title, category, due date, priority, and status.
- View dashboard statistics for total, pending, in-progress, completed, due-today, and high-priority tasks.
- Browser notifications for pending tasks.
- Search by task, category, or priority.
- Filter tasks by status and view them in separate columns.
- Move tasks between pending, in progress, and completed.
- Delete tasks.
- Persistent database storage using `data/tasks.json`.
- Local user storage using `data/users.json` on localhost.
- REST API backend built with Node.js.
- Responsive frontend built with HTML, CSS, and JavaScript.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js HTTP server
- Database: JSON file database
- Deployment: Works on any Node hosting platform

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Deploy For All Devices

For the same login and tasks on phone, laptop, tablet, and every browser, deploy with one shared backend.

1. Deploy `server.js` to a Node hosting service such as Render, Railway, Fly.io, or a VPS.
2. Keep the deployed backend URL.
3. Open `public/config.js`.
4. Set:

```js
window.TASK_API_BASE_URL = "https://your-hosted-backend-url";
```

5. Deploy the frontend. If using Netlify, use:

```text
Publish directory: public
```

After this, one signup is enough. The same email/password can be used from any device because every device connects to the same backend.

If `public/config.js` is left empty, the app still works attractively and privately in the current browser, but each device will keep its own separate local data.

## Multi-Device Login Requirement

For stronger production storage, connect the backend to an online database:

- A hosted Node.js backend, such as Render, Railway, Fly.io, or a VPS.
- An online database, such as MongoDB Atlas, Firebase, Supabase, or PostgreSQL.
- Environment variables for database connection details.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | Get all tasks |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id` | Update task status |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/signup` | Create a private user account |
| `POST` | `/api/login` | Login to a private user account |
| `POST` | `/api/reset-password` | Reset password using email and phone |
| `PATCH` | `/api/profile` | Update logged-in user profile |

## Suggested GitHub Description

My Task Planner is a full-stack personal productivity app for managing tasks with a responsive frontend, Node.js backend, and persistent database storage.
