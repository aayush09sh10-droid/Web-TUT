# Web Tutor

Web Tutor is a full-stack learning platform that helps a user study from YouTube videos and notes images. The app creates AI-powered summaries, quizzes, teaching sections, formula guides, and doubt answers, then saves the learning history for later review.

## What We Have Added

- User authentication with register, login, profile view, and password change
- MongoDB-based user and study history storage
- YouTube video summarization using extracted audio
- Notes image summarization
- AI quiz generation from a summary
- AI teaching mode from a summary
- AI formula guide generation
- AI doubt solving based on saved learning context
- Study history listing, single-item view, delete, and clear history
- Quiz progress saving inside history
- Socket.io progress updates during video summary generation
- Basic backend security hardening:
  - restricted CORS through environment config
  - security headers
  - rate limiting on auth and API routes
  - auth token stored in `sessionStorage` instead of persistent `localStorage`
- Gemini API error handling for quota/high-demand cases with a custom subscription message

## Web Flow

1. User opens the frontend and creates an account or logs in.
2. After authentication, the user reaches the main learning dashboard.
3. The user can:
   - paste a YouTube link
   - upload notes as an image
4. Backend receives the request and validates the auth token.
5. For YouTube flow:
   - backend downloads audio
   - audio is chunked
   - Gemini generates chunk understanding and final structured summary
6. For notes flow:
   - frontend sends image data
   - Gemini reads the notes image and creates a structured summary
7. The summary is saved into MongoDB study history.
8. From the summary, the user can generate:
   - quiz
   - teaching content
   - formula guide
   - doubt answer
9. The user can open History to review previous learning sessions.
10. The user can open Profile to see account details and change password.

## Main Modules

### Frontend

- React + Vite
- Redux Toolkit for auth/theme/app state
- React Router for page navigation
- Tailwind CSS for styling

Important frontend areas:

- `src/component/Auth` for login and register flow
- `src/component/Home` for summarize, quiz, teaching, formula, and doubt flow
- `src/component/History` for saved history
- `src/component/Profile` for profile and password settings

### Backend

- Express server
- MongoDB with Mongoose
- JWT authentication
- Gemini API integration
- Socket.io for progress updates
- yt-dlp + ffmpeg pipeline for YouTube audio extraction

Important backend areas:

- `Backend/index.js` for server setup, CORS, rate limiting, and Socket.io
- `Backend/DB/dbconnect.js` for MongoDB connection
- `Backend/features/auth` for authentication
- `Backend/features/summarize` for Gemini-based study features
- `Backend/features/history` for saved learning records

## Important Installations

### Required Software

Install these on your system before running the project:

- Node.js
- npm
- MongoDB Atlas account or MongoDB database URI
- ffmpeg
- yt-dlp

### Important npm Packages

Frontend:

- `react`
- `react-dom`
- `react-router-dom`
- `@reduxjs/toolkit`
- `react-redux`
- `tailwindcss`
- `vite`

Backend:

- `express`
- `mongoose`
- `dotenv`
- `jsonwebtoken`
- `bcryptjs`
- `cors`
- `socket.io`
- `@google/generative-ai`
- `multer`
- `cloudinary`
- `multer-storage-cloudinary`
- `ffmpeg-static`
- `fluent-ffmpeg`
- `yt-dlp-wrap`

## Installation Steps

### 1. Install frontend dependencies

From the `WeB-Tutor` folder:

```bash
npm install
```

### 2. Install backend dependencies

From the `Backend` folder:

```bash
npm install
```

### 3. Configure environment variables

Create or update `Backend/.env` with the required values:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_AUDIO_CHUNK_SECONDS=300

ACCESS_TOKEN_SECRET=your_jwt_secret
ACCESS_TOKEN_ENTRY=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Frontend optional environment variable:

Create `WeB-Tutor/.env` if needed:

```env
VITE_API_BASE=http://localhost:5001
```

## How To Run

### Run backend

From the `Backend` folder:

```bash
node index.js
```

For development:

```bash
npm run dev
```

### Run frontend

From the `WeB-Tutor` folder:

```bash
npm run dev
```

Then open the Vite frontend URL shown in the terminal, usually:

```text
http://localhost:5173
```

## API Flow Summary

### Auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### History routes

- `GET /api/history`
- `GET /api/history/:id`
- `POST /api/history/:id/quiz-progress`
- `DELETE /api/history`
- `DELETE /api/history/:id`

### Study routes

- `POST /api/summarize`
- `POST /api/summarize-notes`
- `POST /api/quiz`
- `POST /api/teaching`
- `POST /api/formula`
- `POST /api/doubt`

## Security Notes

Security improvements currently added:

- CORS is no longer open to every origin
- API routes are rate-limited
- Basic security headers are added
- JWT-protected routes secure history and study APIs
- Frontend token storage is session-based instead of long-lived local storage

### Security Added In This Project

- Restricted CORS:
  - backend now allows only configured frontend origins
  - `CORS_ALLOWED_ORIGINS` is used instead of open `*` access
- Socket.io origin protection:
  - socket connections use the same controlled origin rules as the backend API
- Rate limiting:
  - auth routes are protected against repeated login/register abuse
  - general API routes are protected against excessive repeated requests
- Security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `X-DNS-Prefetch-Control`
  - restrictive `Content-Security-Policy` on backend responses
- Express hardening:
  - `x-powered-by` is disabled so the server exposes less framework information
  - request body parsing is limited to reduce abuse risk
- Authentication protection:
  - JWT is required for history and AI study routes
  - unauthorized users cannot access saved study data
- Safer frontend token storage:
  - auth token is stored in `sessionStorage`
  - old auth data is removed from persistent `localStorage`
- Gemini failure handling:
  - Gemini quota and high-demand errors now return a controlled custom message instead of raw provider errors
- MongoDB connection validation:
  - backend checks for a valid MongoDB URI before trying to connect
  - clearer startup errors help prevent broken production deployments

For production, still recommended:

- move auth to `HttpOnly` secure cookies
- deploy only over HTTPS
- use production frontend origin in `CORS_ALLOWED_ORIGINS`
- rotate secrets if they were ever exposed

## Current Purpose Of The App

This project is designed as a smart study assistant where a learner can:

- turn long video content into structured study material
- study from uploaded notes
- practice through quizzes
- revise with teaching and formula sections
- ask doubts based on the saved context
- track previous learning sessions

## Folder Structure

```text
Web-Tutor version 1/
|- Backend/
|  |- DB/
|  |- config/
|  |- features/
|  |  |- auth/
|  |  |- history/
|  |  |- summarize/
|  |- middleware/
|  |- routes/
|  |- index.js
|
|- WeB-Tutor/
|  |- src/
|  |  |- component/
|  |  |- store/
|  |- package.json
|  |- README.md
```

## Notes

- If Gemini quota is over or the model is under heavy demand, the backend returns a custom subscription-related error message.
- If YouTube blocks or rate-limits extraction, summarization can fail until the source becomes available again.
- If `npm` is blocked in PowerShell on your system, run commands in Command Prompt or update PowerShell execution policy.
