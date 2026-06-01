# ibrahim-ali-mern-10pshine

A MERN notes app I built where you can write rich-text notes, organize them, record voice notes that get transcribed automatically, and use some AI helpers (suggest title/tags, make flashcards and quizzes from a note).

## Features

- **Notes** – rich text editor, create/edit/delete, pin, favorite, archive, soft delete.
- **Organize** – categories, tags, drag to reorder, checklist items inside a note.
- **Customize** – note background/text color, font, mood label.
- **Voice notes** – record in the browser, it gets transcribed with Groq Whisper. Modes: cleanup, summary, or raw.
- **AI assist** (Groq) – suggest a title, summary, tags or category for a note, and generate flashcards / MCQ quizzes.
- **Auth & profile** – register/login with JWT, update profile, change password, upload an avatar.
- Light/dark theme.

## Tech stack

**Backend:** Node.js, Express 5, MongoDB + Mongoose, JWT, bcryptjs, multer, pino (logging), Groq API. Tests with Mocha/Chai/Sinon/Supertest.

**Frontend:** React 19, Vite, React Router, Tailwind CSS, TipTap (editor), dnd-kit (drag & drop), Axios, Lucide icons.

## Project structure

```
backend/    # Express API – controllers, models, routes, middlewares, tests
frontend/   # React app (Vite) – components, pages, context, router
```

## Setup

You need Node 20+, npm, MongoDB, and a Groq API key (from console.groq.com) for the AI/voice features.

Make a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/notes-app
JWT_SECRET=some-long-random-string
CORS_ORIGIN=http://localhost:5173
GROQ_API=your_groq_api_key
```

Then run the backend and frontend (two terminals):

```bash
# backend
cd backend
npm install
npm start          # http://localhost:5000

# frontend
cd frontend
npm install
npm run dev        # http://localhost:5173
```

> If `GROQ_API` isn't set the app still runs, only the AI and voice routes return a 503.

## Scripts

**Backend:** `npm start`, `npm test`, `npm run test:coverage`
**Frontend:** `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`

## API (quick overview)

All protected routes need `Authorization: Bearer <token>` (token comes from login).

- `/api/users` – register, login, profile, change password, avatar.
- `/api/notes` – CRUD notes + reorder.
- `/api/categories` – CRUD categories.
- `/api/ai` – suggest (title/summary/tags/category), flashcards, quiz.
- `/api/voice` – transcribe an uploaded audio file.

## Testing

Backend tests run on an in-memory MongoDB so you don't need a local DB for them:

```bash
cd backend
npm test
```

## Branching

- `main` – stable branch.
- `develop` – integration branch, PRs go here.
- `feature/<scope>/<name>` – feature branches.
