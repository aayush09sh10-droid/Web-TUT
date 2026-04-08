# Web Tutor

Web Tutor is a full-stack AI study platform that helps a learner study from:

- YouTube videos
- study photos
- uploaded study files such as PDF, TXT, CSV, JSON, markdown, and PPTX

The platform converts those inputs into:

- structured summaries
- topic-wise breakdowns
- quizzes
- teaching paths
- formula guides
- doubt answers
- saved study history

## 1. Project Goal

The goal of the project is to build one smart study workflow:

1. user logs in
2. user submits learning material
3. backend processes and summarizes it with Gemini
4. user generates extra study tools from the summary
5. all learning sessions are saved and can be reopened later

## 2. What Has Been Added

### Main Features Added

- Register and login
- JWT-based protected APIs
- Profile page with password change
- Home dashboard for learning workflows
- YouTube video summarization
- Study photo summarization
- Study file summarization
- PPTX summarization support through backend slide-text extraction
- Topic-wise summary sections
- Quiz generation
- Teaching path generation
- Formula guide generation
- Doubt solving
- Study history page
- Learning detail page
- Quiz progress saving
- Backend Redis caching
- Frontend React Query caching
- Home session persistence
- Security headers, rate limiting, and restricted CORS
- Gemini error shielding in the UI

### Recent Major Additions

- `Photos` mode added in Home
- `Files` mode added in Home
- maximum `10` photos upload limit
- topic-wise summary blocks rendered in the summary UI
- `New Summary` now opens the composer without removing the current summary
- composer close button now works properly
- frontend cache folder created in `src/cache`
- shared local persistence storage added in `src/shared/storage`
- Gemini API errors normalized before reaching the UI

## 3. Full Feature Logic

### A. Authentication

What it does:

- allows a user to register
- login
- stay authenticated in the current session
- view profile
- change password

Logic used:

1. frontend sends auth request
2. backend validates credentials
3. JWT token is created
4. frontend stores auth in `sessionStorage`
5. protected routes are shown only when token exists

Main backend files:

- `Backend/features/auth/routes/auth.js`
- `Backend/features/auth/controllers/login.js`
- `Backend/features/auth/controllers/register.js`
- `Backend/features/auth/controllers/me.js`
- `Backend/features/auth/controllers/changePassword.js`
- `Backend/features/auth/services/auth/*`

Main frontend files:

- `WeB-Tutor/src/component/Auth/Auth.jsx`
- `WeB-Tutor/src/component/Auth/store/authSlice.js`
- `WeB-Tutor/src/App.jsx`

Main React/JS libraries used:

- `react`
- `react-router-dom`
- `@reduxjs/toolkit`
- `react-redux`
- `jsonwebtoken` on backend
- `bcryptjs` on backend

### B. YouTube Video Summary

What it does:

- accepts a YouTube URL
- downloads audio
- chunks the audio
- sends chunk understanding to Gemini
- creates a final structured summary
- saves it into history

Logic used:

1. user pastes a YouTube URL
2. frontend calls `POST /api/summarize`
3. backend downloads audio using `yt-dlp`
4. backend processes audio with `ffmpeg`
5. audio is split into chunks
6. Gemini summarizes chunks
7. backend creates one final structured summary
8. result is saved to MongoDB
9. result is cached in Redis

Main backend files:

- `Backend/features/summarize/controllers/summarizeVideo.js`
- `Backend/features/summarize/services/youtube-audio/*`
- `Backend/features/summarize/services/gemini/summary.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/Home.jsx`
- `WeB-Tutor/src/component/Home/api/homeApi.js`

Main libraries used:

- `yt-dlp-wrap`
- `fluent-ffmpeg`
- `ffmpeg-static`
- `@google/generative-ai`

### C. Study Photos Summary

What it does:

- accepts one or more study photos
- maximum 10 photos
- combines them into one structured study summary
- creates topic-wise sections

Logic used:

1. user switches to `Photos`
2. user selects up to 10 images
3. frontend converts images to base64
4. frontend calls `POST /api/summarize-notes`
5. backend validates file count and image types
6. Gemini reads uploaded images
7. backend creates one combined summary
8. summary contains timeline, paragraphs, and topic blocks
9. result is saved to history and cached

Main backend files:

- `Backend/features/summarize/controllers/summarizeNotes.js`
- `Backend/features/summarize/services/gemini/notes.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/features/PasteLink/PasteLinkFeature.jsx`
- `WeB-Tutor/src/component/Home/utils/studyUploadUtils.js`
- `WeB-Tutor/src/component/Home/Home.jsx`

### D. Study Files Summary

What it does:

- accepts files like PDF, TXT, CSV, JSON, markdown, images, and PPTX
- summarizes them into one structured learning result

Logic used:

1. user switches to `Files`
2. user uploads study files
3. frontend converts them into upload payloads
4. backend validates supported types
5. text-like files are decoded into text
6. image/PDF files are sent as inline Gemini parts
7. PPTX files are converted into slide text on backend
8. Gemini builds a structured summary
9. result is saved and cached

Important note:

- `.pptx` is supported
- old `.ppt` is not supported yet

Main backend files:

- `Backend/features/summarize/services/gemini/notes.js`
- `Backend/features/summarize/controllers/summarizeNotes.js`

### E. Topic-Wise Summary

What it does:

- summary now includes topic blocks
- each topic has:
  - title
  - short explanation
  - key revision points

Logic used:

1. Gemini returns summary JSON
2. backend sanitizes the response
3. if topic blocks are missing, fallback topic sections are created from summary paragraphs
4. frontend renders topic-wise summary cards

Main backend files:

- `Backend/features/summarize/services/gemini/parser.js`
- `Backend/features/summarize/services/gemini/summary.js`
- `Backend/features/summarize/services/gemini/notes.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/features/Summary/SummaryFeature.jsx`
- `WeB-Tutor/src/component/Home/homeUtils.js`

### F. Teaching Path

What it does:

- converts a summary into topic-wise teaching lessons

Logic used:

1. frontend sends the current summary
2. backend asks Gemini to divide the summary into 3 to 6 learning topics
3. each topic returns:
   - summary
   - lesson
   - notes
   - reflection question
4. teaching output is stored in history
5. frontend renders it topic by topic

Main backend files:

- `Backend/features/summarize/controllers/generateTeaching.js`
- `Backend/features/summarize/services/gemini/teaching.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/features/Teaching/TeachingFeature.jsx`

### G. Formula Guide

What it does:

- builds a formula-based revision path from a summary

Logic used:

1. frontend sends the summary
2. backend asks Gemini to decide whether formulas are important
3. output is divided into sections
4. each section contains:
   - formula name
   - formula
   - when to use
   - explanation
   - practice questions
5. output is saved in history and cached

Main backend files:

- `Backend/features/summarize/controllers/generateFormula.js`
- `Backend/features/summarize/services/gemini/formula.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/features/FormulaLab/FormulaLabFeature.jsx`

### H. Quiz Generation

What it does:

- creates MCQ-style quiz questions from the summary

Logic used:

1. summary is sent to backend
2. Gemini creates quiz questions and answers
3. quiz is saved to history
4. user submits quiz
5. score and wrong answers are saved

Main backend files:

- `Backend/features/summarize/controllers/generateQuiz.js`
- `Backend/features/summarize/services/gemini/quiz.js`
- `Backend/features/history/controllers/saveQuizProgress.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/features/GenerateQuiz/GenerateQuizFeature.jsx`

### I. Doubt Solving

What it does:

- answers a user’s doubt using the saved summary and optional teaching/formula context

Logic used:

1. user writes a doubt
2. if required, formula context is generated first
3. backend sends summary + context + question to Gemini
4. answer is saved to history

Main backend files:

- `Backend/features/summarize/controllers/answerDoubt.js`
- `Backend/features/summarize/services/gemini/doubt.js`

Main frontend files:

- `WeB-Tutor/src/component/Home/features/AskDoubt/AskDoubtFeature.jsx`

### J. History and Learning Details

What it does:

- shows all saved study sessions
- allows delete and clear
- opens one full learning record

Logic used:

1. frontend fetches history list
2. list is cached in React Query
3. user opens a history record
4. detail page loads one learning item
5. data is rendered from saved history instead of regenerating everything

Main backend files:

- `Backend/features/history/routes/history.js`
- `Backend/features/history/services/history.js`
- `Backend/features/history/controllers/*`

Main frontend files:

- `WeB-Tutor/src/component/History/History.jsx`
- `WeB-Tutor/src/component/Profile/LearningDetails.jsx`
- `WeB-Tutor/src/component/History/api/historyApi.js`
- `WeB-Tutor/src/component/Profile/api/learningDetailsApi.js`

### K. Home Session Persistence

What it does:

- keeps important Home screen state after reload/reopen

Logic used:

1. Home state is saved to local storage
2. state is tied to the current user
3. state is restored on reopen
4. old state expires after a fixed time window

Main files:

- `WeB-Tutor/src/component/Home/hooks/useHomePersistence.js`
- `WeB-Tutor/src/shared/storage/homeSession.js`

### L. Frontend Cache Logic

What it does:

- caches server data in the frontend

Logic used:

1. `QueryClientProvider` wraps the app
2. shared query keys are used
3. profile/history/learning detail data is cached
4. components read server state through React Query

Main files:

- `WeB-Tutor/src/cache/queryClient.js`
- `WeB-Tutor/src/cache/queryKeys.js`
- `WeB-Tutor/src/cache/cacheUtils.js`
- `WeB-Tutor/src/component/Home/hooks/useHomeHistory.js`
- `WeB-Tutor/src/component/History/History.jsx`
- `WeB-Tutor/src/component/Profile/Profile.jsx`
- `WeB-Tutor/src/component/Profile/LearningDetails.jsx`

### M. Backend Cache Logic

What it does:

- prevents repeated DB reads and repeated Gemini cost

Logic used:

- Redis key generation per user and payload
- history list/detail cache
- profile cache
- summary/quiz/teaching/formula/doubt cache
- invalidation after update/delete/clear/progress save

Main backend files:

- `Backend/services/cache/*`
- `Backend/features/summarize/cache/*`
- `Backend/features/history/cache/historyCache.js`
- `Backend/features/auth/cache/profileCache.js`

### N. Gemini Error Handling

What it does:

- hides raw Gemini/provider errors from the UI

Logic used:

1. Gemini service catches provider errors
2. summarize controllers convert errors into typed responses
3. frontend AI API helpers only surface Gemini-safe messages or direct validation messages

Main files:

- `Backend/features/summarize/services/gemini/parser.js`
- `Backend/features/summarize/controllers/errorResponse.js`
- `WeB-Tutor/src/component/Home/api/homeApi.js`

## 4. Main Frontend and Backend Entry Files

### Main Frontend JS / JSX Files

- `WeB-Tutor/src/main.jsx`
  - React app entry point
  - wraps app with Redux and React Query providers

- `WeB-Tutor/src/App.jsx`
  - routing
  - auth-based route switching
  - theme persistence
  - session auth persistence

- `WeB-Tutor/src/component/Home/Home.jsx`
  - main learning workflow logic
  - upload handling
  - summary generation
  - quiz/teaching/formula/doubt actions

- `WeB-Tutor/src/store/store.js`
  - Redux store setup

### Main Backend JS Files

- `Backend/index.js`
  - main Express server entry point
  - CORS
  - rate limiting
  - JSON body limits
  - Socket.io
  - route mounting

- `Backend/Routes/summarize.js`
  - AI feature routes

- `Backend/features/auth/routes/auth.js`
  - auth routes

- `Backend/features/history/routes/history.js`
  - history routes

## 5. APIs Made In This Project

Total backend API routes made: `15`

### Auth APIs: 4

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### History APIs: 5

- `GET /api/history`
- `GET /api/history/:id`
- `POST /api/history/:id/quiz-progress`
- `DELETE /api/history`
- `DELETE /api/history/:id`

### Study / AI APIs: 6

- `POST /api/summarize`
- `POST /api/summarize-notes`
- `POST /api/quiz`
- `POST /api/teaching`
- `POST /api/formula`
- `POST /api/doubt`

## 6. API Calls Used In Frontend

Total main frontend API helper functions used: `14`

### Home API calls: 8

- `fetchHomeHistory`
- `requestVideoSummary`
- `requestStudySummary`
- `requestQuiz`
- `requestTeaching`
- `requestFormula`
- `requestDoubtAnswer`
- `saveQuizProgress`

### Profile API calls: 2

- `fetchProfile`
- `changePassword`

### History API calls: 3

- `fetchHistory`
- `clearHistory`
- `deleteHistoryItem`

### Learning detail API calls: 1

- `fetchLearningDetails`

## 7. Main React and JS Libraries Used

### Frontend Main Libraries

- `react`
  - UI rendering

- `react-dom`
  - browser rendering entry point

- `react-router-dom`
  - route navigation
  - Home / History / Profile / Learning Detail routing

- `@reduxjs/toolkit`
  - client-side state management
  - auth, theme, Home UI state, history UI state, profile UI state

- `react-redux`
  - connects React components to Redux store

- `@tanstack/react-query`
  - frontend server-state caching
  - history, profile, and learning detail fetch caching

- `tailwindcss`
  - styling

- `vite`
  - frontend build tool and dev server

### Backend Main Libraries

- `express`
  - API server

- `mongoose`
  - MongoDB models and DB access

- `redis`
  - caching

- `jsonwebtoken`
  - JWT auth

- `bcryptjs`
  - password hashing

- `cors`
  - origin protection

- `socket.io`
  - progress event communication

- `@google/generative-ai`
  - Gemini integration

- `yt-dlp-wrap`
  - YouTube audio download

- `fluent-ffmpeg`
  - media processing

- `ffmpeg-static`
  - ffmpeg binary

- `multer`
  - file upload parsing for auth avatar upload

- `jszip`
  - PPTX slide text extraction

## 8. Conversions Used In The Project

### YouTube Conversion Logic

- YouTube URL -> downloaded audio
- audio -> chunked audio files
- chunked audio -> Gemini chunk summaries
- chunk summaries -> final structured summary

### Image Conversion Logic

- browser file -> base64 string
- base64 image -> Gemini inline image input
- Gemini output -> structured summary JSON

### Text File Conversion Logic

- file -> base64
- base64 -> UTF-8 decoded text
- text -> Gemini prompt input

### PPTX Conversion Logic

- file -> base64
- base64 -> zip archive buffer
- zip archive -> slide XML
- slide XML -> extracted readable text
- extracted text -> Gemini prompt input

### Summary Conversion Logic

- raw Gemini output -> parsed JSON
- parsed JSON -> sanitized shape
- sanitized summary -> topic-wise UI rendering
- summary -> teaching / formula / quiz / doubt generation input

## 9. Folder Structure

```text
Web-Tutor version 1/
|- Backend/
|  |- config/
|  |- DB/
|  |- features/
|  |  |- auth/
|  |  |- history/
|  |  |- summarize/
|  |- middleware/
|  |- routes/
|  |- services/
|  |  |- cache/
|  |- index.js
|
|- WeB-Tutor/
|  |- public/
|  |- src/
|  |  |- cache/
|  |  |- component/
|  |  |- shared/
|  |  |  |- storage/
|  |  |- store/
|  |- package.json
|  |- vite.config.js
|  |- README.md
```

## 10. Setup

### Required Software

- Node.js
- npm
- MongoDB URI
- Redis server or Redis Cloud URL
- ffmpeg
- yt-dlp

### Install Frontend

From `WeB-Tutor/`:

```bash
npm install
```

### Install Backend

From `Backend/`:

```bash
npm install
```

### Backend `.env`

Create `Backend/.env`:

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
REDIS_URL=redis://localhost:6379
```

### Frontend `.env`

Optional in `WeB-Tutor/.env`:

```env
VITE_API_BASE=http://localhost:5001
```

## 11. How To Run

### Backend

```bash
cd Backend
npm run dev
```

or

```bash
node index.js
```

### Frontend

```bash
cd WeB-Tutor
npm run dev
```

Default local frontend URL:

```text
http://localhost:5173
```

## 12. Security Added

- restricted CORS
- JWT protected APIs
- session-based frontend auth storage
- security headers
- rate limiting
- body size limits
- disabled `x-powered-by`
- Gemini error shielding

## 13. Current Notes

- `.pptx` is supported through backend text extraction
- `.ppt` is not supported yet
- Gemini/provider errors are hidden behind controlled UI messages
- React Query is used only for server data cache, while Redux is still used for app UI state
- if PowerShell blocks `npm`, use `npm.cmd`
