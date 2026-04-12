# Web Tutor

Web Tutor is a full-stack AI study platform that converts learning input into structured study material.

It supports:

- YouTube videos
- study photos
- study files such as PDF, TXT, CSV, JSON, markdown, images, and PPTX
- Ask AI prompts for any topic

From those inputs, Web Tutor creates:

- structured summaries
- topic-wise breakdowns
- teaching paths
- quizzes
- formula guides
- doubt answers
- saved study history

## 0. What We Implemented Recently

This project was recently improved in four main areas:

1. Redis-backed backend caching
2. frontend request stability and performance
3. backend security and production readiness
4. documentation and environment setup cleanup

### What was done

- moved backend cache flow to a shared Redis-first cache layer
- kept one cache abstraction for summarize, history, profile, and learning snapshot data
- added Redis hosted connection support through `REDIS_URL`
- added `REDIS_REQUIRED=true` support so backend can fail fast instead of silently falling back
- improved backend startup checks for MongoDB and Redis readiness
- added optional HTTPS server configuration for production use
- added stronger security headers and cleaner backend logging
- reduced noisy console output by using shared logger utilities
- fixed duplicate/cancelled development fetch behavior around history/profile requests
- fixed invalid nested `<button>` markup in History activity cards
- added `.env.example` files for backend and frontend

### Main approach used

The main engineering approach for these changes was:

`stable shared abstractions -> safe startup checks -> cache-first reads -> explicit invalidation -> production-safe configuration`

That means:

- one shared backend cache service handles Redis access
- feature modules only ask for cached data through helper functions
- backend verifies required infrastructure before serving traffic
- frontend uses React Query for client-side server-state caching
- history and profile data are invalidated explicitly when writes happen

### Main method used

For backend caching:

1. build a deterministic cache key
2. hash complex payloads when needed
3. check Redis first
4. if cache miss, compute data from AI or MongoDB
5. store JSON in Redis with TTL
6. invalidate related keys after update/delete actions

For frontend performance:

1. use React Query for server-state cache
2. reuse in-flight GET requests in development
3. avoid unnecessary refetches with `staleTime`
4. manually update query cache after local mutations when possible

For production readiness:

1. store infrastructure config in `.env`
2. use hosted Redis via `REDIS_URL`
3. optionally enable HTTPS with cert/key paths
4. restrict CORS and apply security headers
5. start backend only after dependency checks pass

## 1. Problem Statement

Students usually study from multiple sources:

- videos
- handwritten notes
- PDFs and files
- direct questions they want to ask

The problem is that these inputs are unstructured. A learner usually has to:

- watch or read everything manually
- take notes separately
- create revision material separately
- create questions separately
- remember previous sessions separately

Web Tutor solves this by building one unified learning pipeline:

1. accept raw learning input
2. convert it into structured study data
3. generate extra learning tools from that summary
4. store the full session for later use

## 2. Project Goal

The main goal is to create a reusable AI study workflow where the summary becomes the central learning object.

That summary is then used to power:

- teaching
- quiz
- formula
- doubt solving
- saved history

This design avoids rebuilding everything from scratch for each feature and gives a consistent study path.

## 3. Core Approach

The application is designed around one main idea:

`input -> normalized summary -> derived study features -> saved history`

This means Web Tutor does not treat quiz, teaching, formula, and doubt as isolated tools. Instead:

1. the user provides one source
2. backend converts it into one structured summary shape
3. all other learning features use that same summary
4. the result is stored as one growing learning session

Why this approach was used:

- it keeps all AI features consistent
- it reduces repeated preprocessing
- it simplifies frontend rendering
- it makes history reopening easier
- it makes caching much more effective

## 4. System Architecture

### Frontend

Frontend is built with:

- `react`
- `vite`
- `redux toolkit`
- `react query`
- `tailwindcss`

Frontend responsibilities:

- collect user input
- manage UI state
- persist current Home session
- call backend APIs
- cache server data like history and profile
- render study results in different feature views

### Backend

Backend is built with:

- `express`
- `mongoose`
- `redis`
- `@google/generative-ai`
- `socket.io`
- `yt-dlp-wrap`
- `fluent-ffmpeg`
- `jszip`

Backend responsibilities:

- authenticate users
- validate requests
- process input formats
- build AI prompts
- sanitize AI output
- cache repeated results
- save study sessions
- return safe UI-friendly responses

### Database

MongoDB stores permanent user and study session data.

### Cache

Redis stores temporary backend cache.
React Query stores temporary frontend server-state cache.

## 5. Data Storage Design

### A. MongoDB

MongoDB is the permanent storage layer.

The main study model is `StudyHistory`. One document stores one learning session.

Each history item can contain:

- `sourceType`
- `sourceLabel`
- `summary`
- `quiz`
- `teaching`
- `formula`
- `doubt`
- `quizProgress`

Why this design was used:

- all learning generated from one source stays together
- reopening history becomes simple
- later-generated features can be attached to the same session
- the app does not need separate tables/collections for every feature

Implementation logic:

1. summary is saved first
2. when quiz is generated, the same history item is updated
3. when teaching is generated, the same history item is updated
4. when formula is generated, the same history item is updated
5. when doubt is generated, the same history item is updated
6. quiz progress is saved back into the same item

Main file:

- `Backend/features/history/models/StudyHistory.js`

### B. Redis

Redis is the backend temporary cache.

Why Redis is used:

- AI responses can be expensive and slow
- repeated history/profile queries should not hit MongoDB every time
- same payload should return faster when possible

Implementation logic:

1. backend builds a stable cache key
2. complex payloads are sorted deterministically
3. payload is hashed using SHA-256
4. backend checks Redis
5. if cache exists, it returns cached JSON
6. if cache does not exist, backend computes the result and stores it with TTL

What is cached:

- video summary
- notes/files summary
- Ask AI summary
- quiz
- teaching
- formula
- doubt answers
- history list
- history details
- learning snapshot
- profile

Main files:

- `Backend/services/cache/index.js`
- `Backend/services/cache/redisClient.js`
- `Backend/features/summarize/cache/*`
- `Backend/features/history/cache/historyCache.js`
- `Backend/features/auth/cache/profileCache.js`

### C. Frontend Cache

Frontend cache is handled by React Query.

Why React Query is used:

- history and profile are server state, not just UI state
- repeated navigation should not refetch unnecessarily
- invalidation should be easy after delete or update

Implementation logic:

1. app is wrapped with `QueryClientProvider`
2. shared query keys are created
3. screens use React Query for history/profile/detail requests
4. cache can be set or invalidated with helper functions

Main files:

- `WeB-Tutor/src/cache/queryClient.js`
- `WeB-Tutor/src/cache/queryKeys.js`
- `WeB-Tutor/src/cache/cacheUtils.js`

### D. Browser Storage

Two browser storages are used.

`sessionStorage`:

- stores authentication session
- keeps user logged in during current browser session

Why:

- safer than long-lived local storage auth in this project setup

`localStorage`:

- stores current Home study session
- restores unfinished learning flow

Why:

- user should not lose current summary state after refresh or reopen

Implementation logic:

1. Home state is serialized
2. state is tied to current user identity
3. state is restored only if still valid
4. stale state expires after configured time window

Main files:

- `WeB-Tutor/src/component/Auth/store/authSlice.js`
- `WeB-Tutor/src/shared/storage/homeSession.js`
- `WeB-Tutor/src/component/Home/hooks/useHomePersistence.js`

## 6. Cache Behaviour

### Normal Behaviour

For AI features:

1. frontend sends request
2. backend checks Redis
3. if hit, cached result is returned
4. if miss, backend generates new result
5. result is cached
6. result is saved to MongoDB when needed

For history/profile:

1. frontend checks React Query
2. if frontend cache is fresh, cached data is used
3. if stale, backend is called
4. backend may still use Redis before going to MongoDB

### Regenerate Behaviour

Regenerate is intentionally different from normal cached flow.

Why regenerate was added:

- user may want a different version of the same output
- cache should not block fresh AI output

Implementation logic:

1. user clicks regenerate inside a feature
2. frontend sends `forceRegenerate: true`
3. backend skips Redis for that request
4. backend generates fresh AI output
5. current MongoDB history item is updated
6. user remains in the same feature view

Special summary regenerate logic:

when summary is regenerated, dependent feature outputs are cleared:

- quiz
- teaching
- formula
- doubt
- quizProgress

Why:

- old derived data may no longer match the new summary

## 7. Full Feature Documentation

### A. Authentication

Reason for this feature:

- the platform needs personal study history
- saved learning should belong to one user
- protected APIs should not be public

What it does:

- register
- login
- get current user profile
- change password

Implementation logic:

1. frontend sends credentials
2. backend validates email and password
3. password is hashed with `bcryptjs`
4. JWT token is generated
5. frontend stores auth in `sessionStorage`
6. protected requests send `Authorization: Bearer <token>`

Main backend files:

- `Backend/features/auth/routes/auth.js`
- `Backend/features/auth/controllers/login.js`
- `Backend/features/auth/controllers/register.js`
- `Backend/features/auth/controllers/me.js`
- `Backend/features/auth/controllers/changePassword.js`

Main frontend files:

- `WeB-Tutor/src/component/Auth/Auth.jsx`
- `WeB-Tutor/src/component/Auth/store/authSlice.js`
- `WeB-Tutor/src/App.jsx`

### B. YouTube Video Summary

Reason for this feature:

- students often learn from lectures and tutorials
- video content is long and difficult to revise quickly

What it does:

- accepts a YouTube link
- downloads audio
- chunks audio
- asks AI to understand the content
- returns a structured summary

Implementation logic:

1. user pastes video URL
2. frontend calls `POST /api/summarize`
3. backend downloads audio with `yt-dlp`
4. backend uses `ffmpeg` to process audio
5. audio is chunked because long media cannot be sent as one request safely
6. AI summarizes chunks
7. backend combines chunk understanding into a structured summary shape
8. summary is saved to MongoDB
9. summary is cached in Redis

Why chunking was used:

- long audio cannot be processed reliably in one request
- chunking reduces failure risk
- chunk summaries make final summarization more stable

Main files:

- `Backend/features/summarize/controllers/summarizeVideo.js`
- `Backend/features/summarize/services/youtube-audio/*`
- `Backend/features/summarize/services/gemini/summary.js`
- `WeB-Tutor/src/component/Home/Home.jsx`

### C. Study Photos Summary

Reason for this feature:

- students often have handwritten notes or whiteboard photos
- those notes need to become structured text

What it does:

- accepts multiple photos
- reads them as study material
- creates one combined structured summary

Implementation logic:

1. user switches to `Photos`
2. frontend enforces maximum 10 images
3. browser converts images to base64 payloads
4. frontend sends them to `POST /api/summarize-notes`
5. backend validates image count and type
6. AI reads image content
7. backend creates summary JSON
8. summary is saved to history and cached

Why 10-photo limit was added:

- prevents oversized payloads
- reduces AI request failures
- keeps UX manageable

Main files:

- `Backend/features/summarize/controllers/summarizeNotes.js`
- `Backend/features/summarize/services/gemini/notes.js`
- `WeB-Tutor/src/component/Home/utils/studyUploadUtils.js`
- `WeB-Tutor/src/component/Home/features/PasteLink/PasteLinkFeature.jsx`

### D. Study Files Summary

Reason for this feature:

- students study from PDFs, text files, slides, and exported notes
- one upload flow should support common academic files

What it does:

- accepts files
- normalizes them depending on file type
- summarizes them into one structured result

Implementation logic:

1. user switches to `Files`
2. frontend validates file types
3. frontend reads files and builds upload payloads
4. backend checks MIME type
5. text-based files are decoded into text
6. image and PDF content is sent as AI-readable parts
7. PPTX is extracted into text using `jszip`
8. backend sends normalized content to AI
9. summary is saved and cached

Why format conversion was used:

- AI does not handle every file type equally
- some formats need preprocessing before prompting

Important support note:

- `.pptx` is supported
- `.ppt` is not supported yet

Main files:

- `Backend/features/summarize/services/gemini/notes.js`
- `Backend/features/summarize/controllers/summarizeNotes.js`
- `WeB-Tutor/src/component/Home/Home.jsx`

### E. Ask AI Learning Path

Reason for this feature:

- sometimes the user does not have a file or video
- they only want to learn a topic directly from a question

What it does:

- accepts any topic/question
- creates a structured summary
- immediately creates a teaching path
- opens as a learning experience instead of a plain answer

Implementation logic:

1. user switches to `Ask AI`
2. user writes a question or topic
3. frontend calls `POST /api/ask-anything`
4. backend generates summary from the question
5. backend generates teaching from that summary
6. both are saved to one MongoDB history entry
7. summary and teaching can be cached in Redis

Why Ask AI opens Teaching first:

- the user intent is usually “help me learn”
- teaching path is a better first experience than raw summary text

Main files:

- `Backend/features/summarize/controllers/askAnything.js`
- `Backend/features/summarize/services/gemini/ask.js`
- `WeB-Tutor/src/component/Home/Home.jsx`
- `WeB-Tutor/src/component/Home/features/PasteLink/PasteLinkFeature.jsx`

### F. Topic-Wise Summary

Reason for this feature:

- one long paragraph is hard to revise
- students need sections and quick revision points

What it does:

- divides summary into topic blocks
- adds key points per topic

Implementation logic:

1. backend asks AI for structured JSON
2. parser sanitizes returned shape
3. if topic blocks are missing, fallback topics are built from summary paragraphs
4. frontend renders topic cards

Why fallback topic logic was added:

- AI may sometimes omit topic arrays
- UI still needs stable topic-wise rendering

Main files:

- `Backend/features/summarize/services/gemini/parser.js`
- `WeB-Tutor/src/component/Home/features/Summary/SummaryFeature.jsx`

### G. Teaching Path

Reason for this feature:

- students need guided explanation, not only summary
- learning should feel like a sequence of lesson parts

What it does:

- converts summary into 4 to 8 lesson parts
- each part includes richer study sections
- can include part-wise visual study guides

Implementation logic:

1. frontend sends summary to `POST /api/teaching`
2. backend prompts AI to build a structured teaching path
3. each topic can include:
   - title
   - summary
   - why it matters
   - lesson
   - steps
   - notes
   - practice task
   - reflection question
   - visual aid
4. parser sanitizes teaching shape
5. frontend shows left-side topic navigation
6. frontend shows part-wise lesson sections
7. frontend renders visual study block when `visualAid` exists

Why richer teaching structure was added:

- summary alone is not enough for learning
- topic sections create a better study path
- visual blocks help when process or relationship explanation is needed

Main files:

- `Backend/features/summarize/services/gemini/teaching.js`
- `Backend/features/summarize/services/gemini/parser.js`
- `WeB-Tutor/src/component/Home/features/Teaching/TeachingFeature.jsx`

### H. Formula Guide

Reason for this feature:

- some subjects need equations, rules, and application contexts
- formula revision should be separate from plain summary

What it does:

- creates formula-based study sections
- explains each formula and when to use it
- adds practice questions

Implementation logic:

1. frontend sends summary to `POST /api/formula`
2. backend asks AI to derive formula-focused sections
3. parser sanitizes each section
4. frontend divides each section into explanation and practice views

Why separate formula mode exists:

- formula study needs different presentation than plain explanation

Main files:

- `Backend/features/summarize/controllers/generateFormula.js`
- `Backend/features/summarize/services/gemini/formula.js`
- `WeB-Tutor/src/component/Home/features/FormulaLab/FormulaLabFeature.jsx`

### I. Quiz Generation

Reason for this feature:

- students need active recall, not only passive reading

What it does:

- creates multiple-choice questions
- stores answers and explanations
- saves quiz progress

Implementation logic:

1. frontend sends summary to `POST /api/quiz`
2. backend asks AI for structured quiz JSON
3. parser validates question shape
4. frontend renders question options
5. user submits answers
6. frontend calculates score
7. backend saves quiz progress into history

Why quiz progress is saved:

- it makes history more meaningful
- user can revisit previous performance

Main files:

- `Backend/features/summarize/controllers/generateQuiz.js`
- `Backend/features/summarize/services/gemini/quiz.js`
- `Backend/features/history/controllers/saveQuizProgress.js`
- `WeB-Tutor/src/component/Home/features/GenerateQuiz/GenerateQuizFeature.jsx`

### J. Doubt Solving

Reason for this feature:

- after summary and teaching, students still need direct answers
- those answers should use the learning context already created

What it does:

- answers user doubts
- can use summary, formula, and teaching context
- returns structured explanation

Implementation logic:

1. user types a question
2. frontend checks current learning context
3. if formula support is needed, formula can be generated first
4. backend sends summary + teaching + formula + question to AI
5. backend returns structured answer
6. answer is saved to history

Why structured doubt answer was used:

- plain chat text is less useful for revision
- structure improves readability and reuse

Main files:

- `Backend/features/summarize/controllers/answerDoubt.js`
- `Backend/features/summarize/services/gemini/doubt.js`
- `WeB-Tutor/src/component/Home/features/AskDoubt/AskDoubtFeature.jsx`

### K. History and Learning Detail

Reason for this feature:

- students need to reopen previous work
- AI generation should not be repeated for already saved sessions

What it does:

- lists saved sessions
- shows one full session
- supports delete and clear

Implementation logic:

1. history list is requested from backend
2. backend loads from cache or MongoDB
3. frontend caches the list with React Query
4. user opens one item
5. detail screen renders saved result from MongoDB

Why saved-history-first design was used:

- faster revisit experience
- lower AI cost
- stable old sessions

Main files:

- `Backend/features/history/services/history.js`
- `WeB-Tutor/src/component/History/History.jsx`
- `WeB-Tutor/src/component/Profile/LearningDetails.jsx`

### L. Home Session Persistence

Reason for this feature:

- user should not lose active study context after refresh

What it does:

- restores current Home state
- preserves current summary/result and active view

Implementation logic:

1. selected Home state is serialized
2. state is stored locally
3. restore happens on reopen
4. restore is limited to correct current user
5. stale state is discarded

Main files:

- `WeB-Tutor/src/shared/storage/homeSession.js`
- `WeB-Tutor/src/component/Home/hooks/useHomePersistence.js`

### M. Regenerate Feature

Reason for this feature:

- user may want a new version of the same AI output
- cache should not always force identical output

What it does:

- adds regenerate buttons to major study features

Implemented regenerate targets:

- summary
- quiz
- teaching
- formula
- doubt

Implementation logic:

1. frontend shows feature-specific regenerate button
2. click triggers same API with `forceRegenerate: true`
3. backend bypasses Redis
4. backend creates fresh output
5. MongoDB history entry is updated
6. UI remains on same panel

Main files:

- `WeB-Tutor/src/component/Home/Home.jsx`
- `WeB-Tutor/src/component/Home/api/homeApi.js`
- `Backend/features/summarize/controllers/*`

### N. AI Error Shielding

Reason for this feature:

- raw provider errors are confusing and unsafe for UI
- the user should see clean Web Tutor messages

What it does:

- converts provider failures into safe messages
- distinguishes validation, setup, file, busy, and limit issues

Implementation logic:

1. backend parser detects upstream error patterns
2. backend maps them into safe WebTutor messages
3. controllers return typed errors
4. frontend only surfaces safe AI or validation messages

Why this was added:

- better user experience
- no provider internals leaked to UI

Main files:

- `Backend/features/summarize/services/gemini/parser.js`
- `Backend/features/summarize/controllers/errorResponse.js`
- `WeB-Tutor/src/component/Home/api/homeApi.js`

## 8. Main File Roles

### Main Frontend Files

- `WeB-Tutor/src/main.jsx`
  - app entry
  - wraps Redux and React Query providers

- `WeB-Tutor/src/App.jsx`
  - routing and auth gating

- `WeB-Tutor/src/component/Home/Home.jsx`
  - main workflow coordinator
  - summary generation
  - derived feature actions
  - regenerate logic

- `WeB-Tutor/src/component/Home/store/homeSlice.js`
  - Home UI state

- `WeB-Tutor/src/cache/*`
  - frontend cache setup

### Main Backend Files

- `Backend/index.js`
  - Express server setup
  - middleware
  - CORS
  - rate limit
  - JSON limit
  - socket setup

- `Backend/Routes/summarize.js`
  - AI feature routes

- `Backend/features/summarize/services/gemini/*`
  - AI prompt building and parsing

- `Backend/features/history/services/history.js`
  - history create/update/list/load logic

- `Backend/services/cache/index.js`
  - Redis cache abstraction

## 9. APIs Created

Total backend APIs: `16`

### Auth APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### History APIs

- `GET /api/history`
- `GET /api/history/:id`
- `POST /api/history/:id/quiz-progress`
- `DELETE /api/history`
- `DELETE /api/history/:id`

### Study / AI APIs

- `POST /api/summarize`
- `POST /api/summarize-notes`
- `POST /api/ask-anything`
- `POST /api/quiz`
- `POST /api/teaching`
- `POST /api/formula`
- `POST /api/doubt`

## 10. Frontend API Helpers Used

Total main frontend API helpers: `15`

### Home API helpers

- `fetchHomeHistory`
- `requestVideoSummary`
- `requestStudySummary`
- `requestAskAnything`
- `requestQuiz`
- `requestTeaching`
- `requestFormula`
- `requestDoubtAnswer`
- `saveQuizProgress`

### Other helpers

- `fetchProfile`
- `changePassword`
- `fetchHistory`
- `clearHistory`
- `deleteHistoryItem`
- `fetchLearningDetails`

## 11. Main Libraries Used

### Frontend

- `react`
- `react-dom`
- `react-router-dom`
- `@reduxjs/toolkit`
- `react-redux`
- `@tanstack/react-query`
- `tailwindcss`
- `vite`

### Backend

- `express`
- `mongoose`
- `redis`
- `jsonwebtoken`
- `bcryptjs`
- `cors`
- `socket.io`
- `@google/generative-ai`
- `yt-dlp-wrap`
- `fluent-ffmpeg`
- `ffmpeg-static`
- `multer`
- `jszip`

## 12. Conversion Logic Used

### YouTube

- URL -> audio download
- audio -> chunks
- chunks -> AI understanding
- AI understanding -> final summary

### Images

- browser file -> base64
- base64 -> AI inline part
- AI output -> structured summary JSON

### Text Files

- file -> base64
- base64 -> text decode
- text -> AI prompt content

### PPTX

- file -> base64
- base64 -> ZIP buffer
- ZIP -> slide XML
- XML -> extracted text
- extracted text -> AI prompt input

### Ask AI

- user question -> summary
- summary -> teaching path

### Derived Features

- summary -> quiz
- summary -> teaching
- summary -> formula
- summary + context + question -> doubt answer

## 13. Security

Security measures added:

- restricted CORS
- JWT protected APIs
- password hashing with `bcryptjs`
- session-based auth storage on frontend
- security headers
- optional HTTPS backend server support
- body size limits
- disabled `x-powered-by`
- rate limiting
- safe AI error shielding
- production-aware logging
- Redis readiness checks at startup when required

Why these were added:

- prevent open-origin misuse
- protect private user history
- reduce brute force and abuse risk
- reduce provider error leakage

## 14. Folder Structure

```text
Web-Tutor version 1/
|- Backend/
|  |- config/
|  |- DB/
|  |- features/
|  |  |- auth/
|  |  |- history/
|  |  |- summarize/
|  |  |  |- cache/
|  |  |  |- controllers/
|  |  |  |- services/
|  |  |  |  |- gemini/
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
|  |  |  |- Home/
|  |  |  |  |- api/
|  |  |  |  |- features/
|  |  |  |  |- hooks/
|  |  |  |  |- store/
|  |  |  |  |- utils/
|  |  |- shared/
|  |  |  |- storage/
|  |  |- store/
|  |- package.json
|  |- vite.config.js
|  |- README.md
```

## 15. Setup

### Backend `.env`

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=5001
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name

GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite,gemini-2.0-flash,gemini-flash-latest
GEMINI_AUDIO_CHUNK_SECONDS=300

ACCESS_TOKEN_SECRET=your_jwt_secret
ACCESS_TOKEN_ENTRY=7d

CORS_ALLOWED_ORIGINS=http://localhost:5173

REDIS_REQUIRED=true
REDIS_URL=redis://username:password@your-redis-host:6379
REDIS_CACHE_PREFIX=web-tutor
REDIS_CONNECT_TIMEOUT_MS=15000

LOG_LEVEL=debug

HTTPS_ENABLED=false
HTTPS_KEY_PATH=
HTTPS_CERT_PATH=
```

### Frontend `.env`

```env
VITE_API_BASE=http://localhost:5001
```

## 16. Run

### Backend

```bash
cd Backend
npm run dev
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd run dev
```

### Frontend

```bash
cd WeB-Tutor
npm run dev
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd run dev
```

### Production frontend build

```bash
cd WeB-Tutor
npm run build
```

Build output:

- `WeB-Tutor/dist`

## 17. Current Notes

- `.pptx` is supported
- `.ppt` is not supported yet
- React Query is used for server-state cache
- Redux is used for app/UI state
- regenerate bypasses cache intentionally
- if PowerShell blocks `npm`, use `npm.cmd`
- when `REDIS_REQUIRED=true`, backend will not start unless Redis is reachable
- hosted Redis can be inspected with tools like `redis-cli` or Redis Insight

## 18. Future Features

- true AI image generation for teaching visuals
- DOCX support
- export study session as PDF
- bookmarks and favorites
- learning streaks and analytics
- spaced repetition planner
- voice input and speech output
- compare two study sessions side by side
