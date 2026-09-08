# 📐 MiTime (Talent-IQ) — System Architecture & Flow Guide

---

## 🗺️ High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client ["Frontend (React 19 + Vite + Tailwind)"]
        UI[User Interface / Monaco Editor]
        ClerkClient[Clerk Auth SDK]
        StreamVideoSDK[Stream Video React SDK]
        StreamChatSDK[Stream Chat React SDK]
        ReactQuery[TanStack React Query]
    end

    subgraph Auth ["Authentication & Identity"]
        Clerk[Clerk Auth Provider]
    end

    subgraph Backend ["Backend API (Node.js 20 + Express 5)"]
        Server[Express Server :8080 / :3000]
        ClerkMiddleware[Clerk JWT Auth Middleware]
        SessionCtrl[Session Controller]
        ExecuteCtrl[Execute Controller / Harness]
        ProblemsCtrl[Problems Controller]
        ChatCtrl[Chat Controller]
        InngestHandler[Inngest Background Functions]
    end

    subgraph CloudServices ["External Cloud Services"]
        MongoDB[(MongoDB Atlas)]
        StreamService[Stream Video & Chat API]
        Judge0[Judge0 CE Sandbox Engine]
        LeetCodeAPI[LeetCode GraphQL API]
        InngestCloud[Inngest Event Bus]
    end

    %% Client Connections
    UI <--> ClerkClient
    ClerkClient <--> Clerk
    UI <--> StreamVideoSDK & StreamChatSDK
    StreamVideoSDK & StreamChatSDK <--> StreamService
    UI -- "REST API / Axios" --> Server

    %% Backend Routing
    Server --> ClerkMiddleware
    ClerkMiddleware --> SessionCtrl & ExecuteCtrl & ProblemsCtrl & ChatCtrl
    Server --> InngestHandler

    %% Backend to External
    SessionCtrl <--> MongoDB & StreamService
    ExecuteCtrl <--> Judge0
    ProblemsCtrl <--> LeetCodeAPI
    InngestHandler <--> InngestCloud & MongoDB & StreamService
    ChatCtrl <--> StreamService
```

---

## 📦 Core Data Models (MongoDB)

### 1. `User` Model
Stores synchronized profile information from Clerk:
```json
{
  "_id": "ObjectId(...)",
  "clerkId": "user_2xxxxxxxxx",
  "email": "candidate@example.com",
  "name": "Alex Doe",
  "profileImage": "https://img.clerk.com/...",
  "createdAt": "2026-08-16T12:00:00Z"
}
```

### 2. `Session` Model
Stores technical interview rooms:
```json
{
  "_id": "ObjectId(...)",
  "problem": "Two Sum",
  "difficulty": "Easy",
  "host": "ObjectId(User)",
  "participant": "ObjectId(User) | null",
  "callId": "session_17238123456_abc123",
  "status": "active" | "completed",
  "createdAt": "2026-08-16T12:00:00Z"
}
```

---

## 🔄 End-to-End Request Flows

### 1. Authentication & Background Sync Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant Clerk
    participant Inngest
    participant Backend
    participant MongoDB
    participant Stream

    User->>Frontend: Signs in or registers
    Frontend->>Clerk: Authenticates credentials / OAuth
    Clerk-->>Frontend: Returns Session Token (JWT)
    Clerk->>Backend: Webhook Event: clerk/user.created
    Backend->>Inngest: Inngest processes sync-user event
    Inngest->>MongoDB: User.create({ clerkId, name, email, profileImage })
    Inngest->>Stream: upsertStreamUser({ id: clerkId, name, image })
    Inngest-->>Backend: Sync completed
```

---

### 2. Problem Catalog & Search Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant Backend
    participant LeetCode as LeetCode GraphQL
    participant LocalDB as Local Fallback Problems

    User->>Frontend: Opens Problems Page or Selects Problem
    Frontend->>Backend: GET /api/problems?limit=50&skip=0&difficulty=Medium
    Backend->>LeetCode: Queries LeetCode GraphQL API
    alt LeetCode API Responds
        LeetCode-->>Backend: Returns problem list, snippets, metaData
    else LeetCode API Fails / Rate Limited
        Backend->>LocalDB: Loads embedded curated DSA problems
    end
    Backend-->>Frontend: Returns JSON { total, count, problems }
    Frontend->>Frontend: Renders Problem list with difficulty tags
```

---

### 3. Interview Room Creation & Real-Time Setup

```mermaid
sequenceDiagram
    autonumber
    actor Host as Interviewer (Host)
    participant Frontend
    participant Backend
    participant MongoDB
    participant Stream as Stream Video & Chat

    Host->>Frontend: Selects problem & clicks "Create Session"
    Frontend->>Backend: POST /api/sessions (Bearer Token, problem, difficulty)
    Backend->>Backend: Verifies Clerk JWT and generates unique callId
    Backend->>MongoDB: Session.create({ problem, difficulty, host, callId, status: "active" })
    Backend->>Stream: streamClient.video.call("default", callId).getOrCreate()
    Backend->>Stream: chatClient.channel("messaging", callId).create()
    Backend-->>Frontend: Returns { session }
    Frontend->>Frontend: Navigates to /session/:sessionId
    Frontend->>Stream: Joins WebRTC video room & chat channel
```

---

### 4. Candidate Joining a Live Session

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    participant Frontend
    participant Backend
    participant MongoDB
    participant Stream
    actor Host

    Candidate->>Frontend: Clicks "Join Session" from Dashboard
    Frontend->>Backend: POST /api/sessions/:id/join
    Backend->>MongoDB: Validates session is active & not full
    Backend->>MongoDB: Updates session.participant = candidateId
    Backend->>Stream: chatClient.channel.addMembers([candidateClerkId])
    Backend-->>Frontend: Returns updated session object
    Frontend->>Stream: Establishes WebRTC media streams
    Stream-->>Host: Video & Audio connected
    Stream-->>Candidate: Video & Audio connected
```

---

### 5. Automated Code Execution & Evaluation Engine

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    participant Frontend as Monaco Editor
    participant Backend as Express /api/execute
    participant Harness as Language Test Harness
    participant Judge0 as Judge0 CE Sandbox

    Candidate->>Frontend: Writes solution & clicks "Run Code"
    Frontend->>Backend: POST /api/execute { language, code, testCases, metaData }
    Backend->>Harness: Wraps user function inside Language Test Harness:
    Note over Harness: Injects ListNode / TreeNode helpers,<br/>Parses stdin arguments,<br/>Executes user function against all test cases
    Backend->>Judge0: POST /submissions?wait=true { language_id, source_code, stdin }
    Judge0->>Judge0: Compiles & runs code in isolated sandbox
    Judge0-->>Backend: Returns stdout, stderr, compile_output, status
    Backend->>Backend: Normalizes stdout and runs compareOutput()
    Backend-->>Frontend: Returns { success, testResults: [{ input, expected, actual, passed }] }
    alt All Tests Passed
        Frontend->>Frontend: 🎊 Fires Confetti Animation & Shows Success
    else Test Failed / Syntax Error
        Frontend->>Frontend: Displays error trace / mismatched output diff
    end
```

---

### 6. Ending Session & Teardown

```mermaid
sequenceDiagram
    autonumber
    actor Host
    participant Frontend
    participant Backend
    participant MongoDB
    participant Stream
    actor Candidate

    Host->>Frontend: Clicks "End Session"
    Frontend->>Backend: POST /api/sessions/:id/end
    Backend->>Backend: Verifies user is the Host
    Backend->>Stream: Deletes video call & chat channel
    Backend->>MongoDB: session.status = "completed"
    Backend-->>Frontend: 200 OK { message: "Session ended successfully" }
    Frontend->>Frontend: Host navigates to Dashboard
    Candidate->>Frontend: Real-time listener detects status === "completed"
    Frontend->>Frontend: Candidate auto-navigates back to Dashboard
```

---

## 📡 API Endpoint Inventory

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Health check endpoint for uptime monitors / Cloud Run |
| `GET` | `/api/chat/token` | Yes | Generates Stream Chat user token for authenticated client |
| `POST` | `/api/sessions` | Yes | Creates a new interview session, video call, and chat room |
| `GET` | `/api/sessions/active` | Yes | Retrieves list of all currently open interview sessions |
| `GET` | `/api/sessions/my-recent` | Yes | Retrieves user's past completed interview sessions |
| `GET` | `/api/sessions/:id` | Yes | Fetches single session details by ID |
| `POST` | `/api/sessions/:id/join` | Yes | Candidate joins an active session |
| `POST` | `/api/sessions/:id/end` | Yes | Host terminates and archives the session |
| `POST` | `/api/execute` | No / Yes | Runs user code against test harness using Judge0 |
| `GET` | `/api/problems` | Yes | Fetches paginated problem catalog with starter code & metadata |
| `GET` | `/api/problems/:slug` | Yes | Fetches detailed problem description, examples, and snippets |
| `ALL` | `/api/inngest` | Webhook Key | Inngest event router for background Clerk synchronization |

---

## 🔒 Security & Performance Features

1. **Sandboxed Code Execution**: All user code is executed remotely on **Judge0 CE** isolated compute environments, protecting the core backend server from infinite loops, malicious scripts, and resource exhaustion.
2. **Zero-Trust JWT Verification**: Every protected API route runs through `clerkMiddleware()` and custom `protectRoute` to validate user identity directly against Clerk authentication before accessing database records.
3. **Deterministic Output Comparison**: The `compareOutput` engine supports deep JSON matching, whitespace normalization, float tolerances ($10^{-5}$), and custom data structures (`ListNode`, `TreeNode`).
