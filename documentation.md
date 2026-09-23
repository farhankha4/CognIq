# CognIq — Technical Documentation

**CognIq (BrainBridge)** is a full-stack, real-time collaborative coding and technical interview platform. It enables developers to host and participate in 1-on-1 live coding sessions featuring interactive code editing, multi-language code execution, real-time WebRTC video/audio calls, and integrated text chat.

---

## 📋 Table of Contents
1. [Project Overview & Purpose](#-project-overview--purpose)
2. [System Architecture](#-system-architecture)
3. [Technologies Used & Technical Rationale](#-technologies-used--technical-rationale)
4. [Directory Structure & File Responsibilities](#-directory-structure--file-responsibilities)
5. [Complete API Endpoints Reference](#-complete-api-endpoints-reference)
6. [Key Features & User Workflows](#-key-features--user-workflows)
7. [Environment Configuration & Deployment](#-environment-configuration--deployment)

---

## 🎯 Project Overview & Purpose

CognIq solves the challenges of remote technical interviewing and peer programming by bringing together:
- **VS Code-grade Code Editor**: Embedded Monaco Editor with multi-language syntax highlighting and starter code.
- **Online Code Execution**: Execution of JavaScript, Python, and Java code against test cases using the Piston API.
- **WebRTC Video & Audio Calling**: Low-latency video and audio streams powered by Stream Video SDK.
- **Real-Time Text Messaging**: In-session chat channel powered by Stream Chat SDK.
- **Automated User & State Synchronization**: Identity management via Clerk, persistent state in MongoDB, and asynchronous event processing via Inngest.

---

## 🏗️ System Architecture

CognIq follows a modern decoupled architecture:

```
                  ┌─────────────────────────────────────────┐
                  │           React 19 + Vite SPA           │
                  │   (Monaco, Stream SDK, React Query)     │
                  └────────────────────┬────────────────────┘
                                       │
                    HTTP + Bearer Token│ (Axios Interceptor)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Express.js Serverless API         │
                  │  (clerkMiddleware, protectRoute, CORS)  │
                  └──────┬─────────────┬─────────────┬──────┘
                         │             │             │
        Mongoose Connect │             │GetOrCreate  │Verify & Sync
                         ▼             ▼             ▼
       ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
       │  MongoDB Atlas   │  │   Stream Cloud   │  │  Clerk / Inngest │
       │ (User & Session) │  │  (Video & Chat)  │  │(Webhooks & Sync) │
       └──────────────────┘  └──────────────────┘  └──────────────────┘
```

1. **Client Layer**: React 19 single-page application built with Vite, Tailwind CSS v4, and DaisyUI.
2. **Authentication Layer**: Clerk handles OAuth / Email authentication and issues JWT session tokens.
3. **Backend API Layer**: Express v5 REST API hosted serverlessly on Vercel (`api/index.js`), authenticated via `@clerk/express`.
4. **Data Layer**: MongoDB Atlas storing user profiles and coding session metadata.
5. **Real-Time Services**: GetStream for WebRTC video calling and chat messaging.
6. **Code Execution Service**: Piston Engine (`https://emkc.org/api/v2/piston`) for running user code safely in sandboxed containers.

---

## 🛠️ Technologies Used & Technical Rationale

### Frontend Stack

| Technology | Purpose & Rationale |
| :--- | :--- |
| **React 19** | Industry-standard UI library for building dynamic, reactive component hierarchies. |
| **Vite** | Next-generation build tool providing fast HMR (Hot Module Replacement) and optimized production builds. |
| **Tailwind CSS v4 & DaisyUI** | Utility-first CSS framework and component library for responsive styling and dark/light themes. |
| **Monaco Editor (`@monaco-editor/react`)** | The code editor that powers VS Code, offering syntax highlighting, line numbers, and multi-language support in browser. |
| **@clerk/clerk-react** | Handles client-side login/signup modals, user profile buttons, and JWT token management. |
| **@stream-io/video-react-sdk & stream-chat-react** | WebRTC video/audio calling SDK with camera toggles, screen sharing, speaker layout, and instant messaging components. |
| **@tanstack/react-query** | Efficient server state management, caching, background refetching (e.g. 5s session status polling), and mutation handling. |
| **React Router v7** | Client-side routing for navigating between Home, Dashboard, Problems, and Session pages. |
| **react-resizable-panels** | Provides resizable split-pane layouts separating problem descriptions, code editor, output panel, and video/chat UI. |
| **Lucide React** | Modern SVG icon set. |
| **React Hot Toast & Canvas Confetti** | Toast notifications for user feedback and celebratory confetti on successful code execution. |

---

### Backend Stack

| Technology | Purpose & Rationale |
| :--- | :--- |
| **Node.js & Express.js v5** | Lightweight, fast web framework for handling REST API routes and CORS preflights. |
| **MongoDB & Mongoose** | NoSQL database for persisting user records (`User` model) and live/completed sessions (`Session` model). Features connection caching for serverless environments. |
| **@clerk/express** | Middleware for verifying Clerk JWT bearer tokens (`Authorization: Bearer <token>`) and attaching `req.auth()` to incoming requests. |
| **@stream-io/node-sdk & stream-chat** | Node SDK for server-side generation of Stream user authentication tokens, video call room creation, and chat channel setup. |
| **Inngest (`inngest/express`)** | Event-driven background job system triggered by Clerk webhooks (`clerk/user.created`, `clerk/user.deleted`) to keep MongoDB & Stream user records in sync. |
| **CORS & Dotenv** | Middleware for cross-origin security between Vercel frontend/backend domains and environment variable management. |

---

### External Services & APIs

| Service | Role |
| :--- | :--- |
| **Piston API** | Open-source code execution engine running code in sandboxed Docker containers for JavaScript, Python, and Java. |
| **Clerk Auth** | Identity provider handling sign-up, sign-in, user sessions, and JWT issuing. |
| **GetStream** | Infrastructure provider for ultra-low latency WebRTC video calling and real-time chat channels. |

---

## 📁 Directory Structure & File Responsibilities

```text
BrainBridge/
├── backend/
│   ├── api/
│   │   └── index.js               # Vercel serverless function entry point
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── chatController.js  # Stream token generation controller
│   │   │   └── sessionController.js# Session CRUD, join, end, and Stream room setup
│   │   ├── lib/
│   │   │   ├── db.js              # Mongoose MongoDB connection with serverless caching
│   │   │   ├── env.js             # Environment variable validation & exports
│   │   │   ├── inngest.js         # Inngest functions for Clerk user creation/deletion hooks
│   │   │   └── stream.js          # StreamChat & StreamClient initializers and user upsert/delete
│   │   ├── middleware/
│   │   │   └── protectRoute.js    # Auth guard with Clerk token verification & user auto-sync fallback
│   │   ├── models/
│   │   │   ├── Session.js         # Mongoose schema for active/completed coding sessions
│   │   │   └── User.js            # Mongoose schema for user accounts
│   │   ├── routes/
│   │   │   ├── chatRoutes.js      # Express router for /api/chat endpoints
│   │   │   └── sessionRoute.js    # Express router for /api/sessions endpoints
│   │   └── server.js              # Express app setup, CORS, middleware, and dev server listener
│   ├── package.json               # Backend dependencies and scripts
│   └── vercel.json                # Vercel backend serverless rewrite rules
│
└── frontend/
    ├── public/                    # Static images, assets, and language logos
    ├── src/
    │   ├── api/
    │   │   └── sessions.js        # Axios wrapper functions for session backend endpoints
    │   ├── components/
    │   │   ├── ActiveSessions.jsx # Dashboard component displaying active 1-on-1 sessions
    │   │   ├── CodeEditorPanel.jsx# Monaco Editor container with language selector & Run button
    │   │   ├── CreateSessionModal.jsx # Modal for creating a new room with problem selector
    │   │   ├── Navbar.jsx         # Global navigation bar with Clerk UserButton & links
    │   │   ├── OutputPanel.jsx    # Terminal output container for code execution results
    │   │   ├── ProblemDescription.jsx # Problem details viewer for single problem page
    │   │   ├── RecentSessions.jsx # History component showing completed user sessions
    │   │   ├── StatsCards.jsx     # Dashboard stat counters for active & completed rooms
    │   │   ├── VideoCallUI.jsx    # Stream Video & Chat UI with camera/mic controls & tab view
    │   │   └── WelcomeSection.jsx # Dashboard hero section with Create Session button
    │   ├── data/
    │   │   └── problems.js        # Problem catalog (Two Sum, Reverse String, Palindrome, etc.)
    │   ├── hooks/
    │   │   ├── useSessions.js     # React Query hooks for session queries and mutations
    │   │   └── useStreamClient.js # Custom hook for initializing Stream Video & Chat clients
    │   ├── lib/
    │   │   ├── axios.js           # Configured Axios instance with Clerk Bearer token interceptor
    │   │   ├── piston.js          # Piston API client for executing code in JS, Python, and Java
    │   │   ├── stream.js          # Client-side StreamVideoClient helper functions
    │   │   └── utils.js           # Utility functions (difficulty badge styling, formatting)
    │   ├── pages/
    │   │   ├── DashboardPage.jsx  # Main user dashboard with stats, active rooms, & history
    │   │   ├── HomePage.jsx       # Public landing page with features overview & Clerk login button
    │   │   ├── ProblemPage.jsx    # Solo practice page for single problem solving
    │   │   ├── ProblemsPage.jsx   # Public catalog of all available coding problems
    │   │   └── SessionPage.jsx    # Live 1-on-1 collaborative workspace (Editor, Video, Chat)
    │   ├── App.jsx                # Main application component with route definitions
    │   ├── main.jsx               # React DOM entry point wrapped with ClerkProvider & QueryClientProvider
    │   └── index.css              # Tailwind CSS imports and global styles
    ├── package.json               # Frontend dependencies and Vite scripts
    └── vercel.json                # Frontend Vercel single-page app rewrite configuration
```

---

## 📡 Complete API Endpoints Reference

### Health & Server Verification
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | No | Basic health check endpoint returning server status message. |
| `GET` | `/health` | No | Diagnostic endpoint verifying API availability and MongoDB connection state. |

---

### Sessions API (`/api/sessions`)

| Method | Endpoint | Auth Required | Request Body / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/sessions` | **Yes** | `{ problem: string, difficulty: string }` | Creates a new coding session in MongoDB, provisions a Stream Video call, and creates a Stream Chat messaging channel. |
| `GET` | `/api/sessions/active` | **Yes** | None | Fetches up to 20 active sessions (`status: "active"`) populated with host and participant user details. |
| `GET` | `/api/sessions/my-recent` | **Yes** | None | Fetches up to 20 completed sessions where the logged-in user was either host or participant. |
| `GET` | `/api/sessions/:id` | **Yes** | URL Param: `id` | Fetches details of a specific session by MongoDB `_id`, populated with user details. |
| `POST` | `/api/sessions/:id/join` | **Yes** | URL Param: `id` | Joins an active session as participant, adds user to Stream chat channel members. |
| `POST` | `/api/sessions/:id/end` | **Yes** | URL Param: `id` | Host-only endpoint that hard-deletes Stream call & chat channel, and sets session status to `"completed"`. |

---

### Stream Token API (`/api/chat`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/token` | **Yes** | Generates a JWT user token signed with `STREAM_API_SECRET` for the logged-in user's `clerkId`. |

---

### Background Inngest Webhook API (`/api/inngest`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/inngest` | Webhook Signature | Listens for Clerk events (`clerk/user.created`, `clerk/user.deleted`) to automatically create/delete user records in MongoDB and upsert/delete user profiles in Stream. |

---

## 💡 Key Features & User Workflows

### 1. Seamless Authentication & User Sync
- **Authentication**: Users sign up or log in via Clerk (Google OAuth or Email).
- **Background Event Sync**: When a user registers, Clerk emits `clerk/user.created` to Inngest, creating the user record in MongoDB and upserting the user in Stream.
- **Resilience Fallback**: If an Inngest webhook is missed, the backend middleware (`protectRoute.js`) automatically fetches the user from Clerk SDK and syncs them to MongoDB and Stream on the fly.

### 2. Dashboard & Session Creation
- Users land on the `/dashboard` page displaying real-time session counters and active session cards.
- Clicking **Create Session** opens a modal where users pick a coding problem (e.g., Two Sum, Reverse String).
- Creating a room creates a database record, provisions a WebRTC video call room, and creates a chat channel.
- Users are redirected immediately to `/session/:id`.

### 3. Split-Screen Collaborative Workspace
- **Problem Details Panel**: Shows problem statement, examples, explanations, and constraints.
- **Monaco Code Editor**: Code editor supporting JavaScript, Python, and Java with starter code templates.
- **Code Execution**: Clicking **Run Code** sends the code to the Piston API. Execution stdout/stderr is formatted in the output console. Correct solutions trigger celebratory confetti.
- **WebRTC Video Call**: Displays video streams for both Host and Participant with mute, camera toggle, screen share, and leave controls.
- **Live Chat Channel**: Embedded tabbed text chat allowing participants to message during the coding session.

---

## ⚙️ Environment Configuration & Deployment

### Environment Variables

#### Frontend Environment Variables (`frontend/.env`)
```env
VITE_API_URL=https://cogn-iq.vercel.app/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_STREAM_API_KEY=cjh...
```

#### Backend Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-cogniq.vercel.app
DB_URL=mongodb+srv://<user>:<password>@cluster0.mongodb.net/cogniq?retryWrites=true&w=majority
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
STREAM_API_KEY=cjh...
STREAM_API_SECRET=2u7...
INNGEST_EVENT_KEY=2G...
INNGEST_SIGNING_KEY=signkey-prod-...
```

---

### Deployment Setup on Vercel

1. **Backend Deployment**:
   - Deployed as a Vercel Serverless Express API using `backend/api/index.js` and `backend/vercel.json` rewrites.
   - Requires MongoDB Atlas IP Access List set to `0.0.0.0/0`.
2. **Frontend Deployment**:
   - Deployed as a Vercel Single-Page Application using Vite build (`frontend/dist`) and `frontend/vercel.json` SPA rewrites.
