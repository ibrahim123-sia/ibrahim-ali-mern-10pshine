# ibrahim-ali-mern-10pshine

A full-stack MERN notes application with AI-assisted writing, voice transcription, study tools (flashcards & quizzes), and rich note customization.

Users can register, write rich-text notes, organize them by category and tag, pin/favorite/archive them, customize colors/fonts/mood labels, drag to reorder, record voice notes that are auto-transcribed and cleaned up, and turn any note into a flashcard deck or multiple-choice quiz.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Local setup](#local-setup)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Testing](#testing)
- [Code quality (SonarCloud)](#code-quality-sonarcloud)
- [Branching & workflow](#branching--workflow)

---

## Features

**Notes**
- Rich-text editor (TipTap) with headings, lists, links, highlight, underline, text alignment.
- Create, update, delete, view single note.
- Pin, favorite, archive, soft-delete (`deletedAt`).
- Tag a note with multiple lowercase tags (deduped, max 40 chars each).
- Assign a note to a user-owned category.
- Inline checklist items (`text` + `done`), capped at 100 per note.
- Per-note customization: background color, text color, font (sans / serif / mono), mood label (productive / study / idea / important).
- Drag-and-drop reorder (persists `order` per note via bulk write).

**Categories**
- Per-user categories with name, hex color, and optional icon.
- Unique `(userId, name)` index — no duplicate category names per user.

**Voice notes**
- In-browser recording → uploaded to backend → transcribed via Groq Whisper (`whisper-large-v3`, English-locked).
- Three modes:
  - `cleanup` — fix grammar/punctuation without changing meaning.
  - `summary` — overview + bulleted key points covering every distinct topic spoken.
  - `raw` — return Whisper output as-is.
- 25 MB audio cap; accepts webm/ogg/mp4/m4a/mp3/wav.

**AI assist (Groq `llama-3.1-8b-instant`)**
- Suggest a title for the current note.
- Suggest a 2-sentence summary.
- Suggest tags (lowercase, hyphenated, 3–6 tags).
- Suggest a category — matches an existing one if it fits, otherwise proposes a new name.
- Generate 4–16 flashcards (`front` / `back`) from a note.
- Generate 3–12 multiple-choice questions with 4 options, correct index, and short explanation.

**Auth & profile**
- Email/password registration, bcrypt hashing.
- JWT (30 day expiry) bearer-token auth on all protected routes.
- Update name and theme; change password (with current-password check); upload avatar (JPEG/PNG/WEBP/GIF, 2 MB cap).

**UI**
- React 19 + Vite 8 + Tailwind CSS 3.
- Light/dark theme stored on the user document and persisted client-side.
- Skeleton cards, empty states, confirm dialogs, search suggestions, sortable card grid.

---

## Tech stack

**Backend**
- Node.js (ES modules)
- Express 5
- MongoDB + Mongoose 8
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs` for password hashing
- `multer` for file uploads
- `pino` + `pino-http` + `pino-pretty` for structured logging
- Groq API (chat + Whisper) for AI features
- Mocha + Chai + Sinon + Supertest + `mongodb-memory-server` for tests
- `c8` for coverage (LCOV → SonarCloud)

**Frontend**
- React 19, React Router 7
- Vite 8
- Tailwind CSS 3 + PostCSS + Autoprefixer
- TipTap 3 (`@tiptap/react`, starter-kit + link, underline, highlight, text-align, placeholder)
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop reorder
- Axios for HTTP
- Lucide React for icons
- ESLint 9 with React Hooks / React Refresh plugins

---

## Project structure

```
ibrahim-ali-mern-10pshine/
├── backend/
│   ├── configs/
│   │   ├── db.js              # Mongo connection
│   │   ├── groq.js            # Groq chatCompletion + JSON parser
│   │   └── logger.js          # pino logger
│   ├── controllers/
│   │   ├── aiController.js    # suggest, generateFlashcards, generateQuiz
│   │   ├── categoryController.js
│   │   ├── noteController.js  # CRUD + reorder + sanitization
│   │   ├── userController.js  # auth, profile, password, avatar
│   │   └── voiceController.js # whisper + cleanup/summary
│   ├── middlewares/
│   │   ├── auth.js            # JWT `protect`
│   │   └── upload.js          # multer for avatars (2 MB) & audio (25 MB)
│   ├── models/
│   │   ├── Category.js
│   │   ├── Note.js
│   │   └── User.js
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── noteRoutes.js
│   │   ├── userRoute.js
│   │   └── voiceRoutes.js
│   ├── tests/                 # mocha test suites (controllers, models, middlewares, configs)
│   ├── uploads/               # runtime: /avatars and /voice
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── auth/              # login.jsx, register.jsx
│   │   ├── components/
│   │   │   ├── customization/ # color/font/mood/checklist pickers, autosave indicator
│   │   │   ├── editor/        # RichTextEditor + toolbar
│   │   │   ├── smart/         # SmartPanel (AI suggestions UI)
│   │   │   ├── study/         # FlashcardDeck, QuizRunner, StudyModeModal
│   │   │   ├── voice/         # VoiceRecorder
│   │   │   ├── CategoryManagerModal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── NoteCard.jsx
│   │   │   ├── NoteEditorModal.jsx
│   │   │   ├── SearchSuggestions.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SkeletonCard.jsx
│   │   │   ├── SortableNoteCard.jsx
│   │   │   └── TagInput.jsx
│   │   ├── context/           # AppProvider, ThemeProvider
│   │   ├── pages/             # NotesPage, ProfilePage
│   │   ├── router/            # ProtectedRoute, AuthRoutes
│   │   ├── utils/             # formatTime
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── package.json
├── .github/workflows/
│   └── sonarcloud.yml         # CI: runs backend tests + SonarCloud scan
├── sonar-project.properties
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **MongoDB** — local instance or a MongoDB Atlas connection string
- **Groq API key** — required for AI suggestions and voice transcription. Create one at [console.groq.com](https://console.groq.com).

---

## Environment variables

Create a `.env` file in `backend/` (it is gitignored). The frontend reads no env vars by default — the API base URL is hardcoded in the axios client.

`backend/.env`:

```env
# Server
PORT=5000

# Mongo
MONGO_URI=mongodb://127.0.0.1:27017/notes-app

# Auth
JWT_SECRET=replace-with-a-long-random-string

# CORS — comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:5173

# Groq AI (chat + whisper). Required for AI/voice routes.
GROQ_API=gsk_your_groq_api_key_here
```

If `GROQ_API` is missing, AI and voice routes respond with `503 GROQ_API key is not configured on the server`. The rest of the app continues to work.

---

## Local setup

Clone and install both workspaces:

```bash
git clone https://github.com/ibrahim123-sia/ibrahim-ali-mern-10pshine.git
cd ibrahim-ali-mern-10pshine

# Backend
cd backend
npm install
# Create .env (see above)
npm start                 # http://localhost:5000

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev               # http://localhost:5173
```

Uploaded files land under `backend/uploads/avatars/` and `backend/uploads/voice/`. They are served statically at `/uploads/...` by the Express app.

---

## Available scripts

**Backend** (`cd backend`)

| Script | Description |
| --- | --- |
| `npm start` | Run the server with `node server.js` |
| `npm test` | Run all Mocha tests (`NODE_ENV=test`, 30 s timeout) |
| `npm run test:coverage` | Run tests with `c8`, emit `lcov.info` under `coverage/` |

**Frontend** (`cd frontend`)

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |

---

## API reference

All protected routes require the header `Authorization: Bearer <jwt>`. The JWT is returned by `POST /api/users/login`.

Base URL: `http://localhost:5000`

### Auth & profile — `/api/users`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| POST | `/register` | – | `{ name, email, password }` | Create user. Returns `{ _id, name, email }` (201). |
| POST | `/login` | – | `{ email, password }` | Returns `{ success, token }` or `{ success: false, message }`. |
| POST | `/logout` | yes | – | No-op (token is stateless). |
| GET | `/profile` | yes | – | Returns the authenticated user document. |
| PUT | `/profile` | yes | `{ name?, theme? }` | Update name and/or theme (`light`/`dark`). |
| PUT | `/password` | yes | `{ currentPassword, newPassword }` | Change password (≥ 6 chars, must differ). |
| POST | `/avatar` | yes | multipart `avatar` | Upload avatar image (JPEG/PNG/WEBP/GIF, 2 MB). |

### Notes — `/api`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/notes` | yes | Create note. `title` and `content` required; all sanitized fields accepted. |
| GET | `/notes` | yes | List the user's notes sorted by `updatedAt` desc. |
| POST | `/notes/reorder` | yes | Body `{ ids: [noteId, ...] }`. Sets `order = index` for each. |
| GET | `/notes/:id` | yes | Get one note (owner-scoped). |
| PUT | `/notes/:id` | yes | Update any of the sanitized fields. |
| DELETE | `/notes/:id` | yes | Hard delete. |

Editable note fields: `title`, `content`, `category` (ObjectId or null), `tags` (string[]), `pinned`, `favorite`, `archived`, `deletedAt` (Date or null), `noteColor` (hex), `textColor` (hex), `fontStyle` (`sans`/`serif`/`mono`), `checklist` ([{text, done}]), `moodLabel` (`''`/`productive`/`study`/`idea`/`important`), `order` (Number), `voiceNote` (string).

### Categories — `/api/categories`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/categories` | List the user's categories. |
| POST | `/categories` | Create `{ name, color?, icon? }`. |
| PUT | `/categories/:id` | Update name/color/icon. |
| DELETE | `/categories/:id` | Delete. |

### AI — `/api/ai`

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| POST | `/ai/suggest` | `{ what, content, title?, categories? }` | `what ∈ {title, summary, tags, category}`. Returns one of `{ title }`, `{ summary }`, `{ tags }`, `{ matchId, matchName }` / `{ suggestName }`. |
| POST | `/ai/flashcards` | `{ content, title?, count? }` | `count` clamped to `[4, 16]`. Returns `{ cards: [{ front, back }] }`. |
| POST | `/ai/quiz` | `{ content, title?, count? }` | `count` clamped to `[3, 12]`. Returns `{ questions: [{ question, options[4], correctIndex, explanation }] }`. |

### Voice — `/api/voice`

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| POST | `/voice/transcribe` | multipart `audio` + `mode?` (`cleanup`/`summary`/`raw`, default `cleanup`) | Returns `{ audioUrl, transcript, text, mode }`. Audio is stored at `/uploads/voice/...` and served statically. |

Errors follow `{ message: "..." }` with sensible HTTP codes (`400` validation, `401` auth, `404` not found, `422` model gave unusable output, `502`/`503` upstream/AI configuration issues, `500` unhandled).

---

## Data models

**User**
- `name` (required), `email` (unique, required), `password` (bcrypt-hashed via pre-save hook)
- `profileImage` (relative URL string, default `''`)
- `theme` (`'light' | 'dark'`, default `'light'`)
- Method: `matchPassword(plain)`

**Note** — see [Editable note fields](#notes--api) above. Indexes on `userId`, `category`, `deletedAt`.

**Category**
- `userId` (ref User, indexed), `name` (trim, ≤ 40), `color` (default `#f59e0b`), `icon`
- Compound unique index on `(userId, name)`

---

## Testing

Backend tests use Mocha + Chai + Sinon + Supertest, and spin up an in-process MongoDB via `mongodb-memory-server` (no local Mongo needed for tests).

```bash
cd backend
npm test                  # plain run
npm run test:coverage     # writes coverage/lcov.info for SonarCloud
```

Suites live under `backend/tests/` and cover controllers, models, middlewares, and config modules. `server.js`, `configs/db.js`, `configs/logger.js`, all routes, and the entire frontend are excluded from coverage in `sonar-project.properties`.

The frontend has no unit-test suite — UI is verified manually and via lint.

---

## Code quality (SonarCloud)

- Project key: `ibrahim123-sia_ibrahim-ali-mern-10pshine`
- Organization: `ibrahim123-sia`
- Free-tier plan; the analyzed branch is locked to the GitHub default (`main`).
- CI workflow: `.github/workflows/sonarcloud.yml` runs backend tests with coverage and uploads the LCOV report.
- Sources scanned: `backend/`, `frontend/src/`.
- Ignored rules (see `sonar-project.properties`):
  - `javascript:S6774` (prop-types) — frontend only.
  - `javascript:S3776` (cognitive complexity) — globally.
  - `javascript:S1192` (string-literal duplication) — globally.
  - `javascript:S6853` (label-has-associated-control) — frontend only.

---

## Branching & workflow

- `main` — stable. Default base for SonarCloud analysis.
- `develop` — integration branch. PRs target `develop`.
- `feature/<scope>/<name>` — new work. When stacked on an in-flight feature, base on that feature branch and rebase forward as it lands.
- Merges to `main` happen via supervisor approval, not direct push.
