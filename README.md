# Gillytech — Collaborative STEM Reasoning Platform

A full-stack web application for live, collaborative STEM reasoning in CBC (Competency-Based Curriculum) classrooms. Built for Kenyan secondary schools, Grades 7–12.

---

## What it does

Gillytech transforms classroom assessment from memorisation → reasoning and collaboration.

**The core experience:** Before any student can select an answer, they must first explain their reasoning in writing. They discuss in real-time with their group, then submit. The platform scores reasoning quality, correctness, and speed — and tracks CBC competencies automatically.

---

## Roles

| Role | Access |
|------|--------|
| **Teacher** | Create sessions, build questions, monitor live classes, view analytics & CBC reports |
| **Student** | Join sessions, reason-then-answer, group chat, view leaderboard & badges |
| **Admin** | Platform-wide overview, teacher management |

---

## Quick start

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed

```bash
cd backend && node src/db/seed.js
```

### 3. Run (two terminals)

```bash
# Terminal 1 — backend
cd backend && node src/index.js

# Terminal 2 — frontend
cd frontend && npx vite
```

Open **http://localhost:5173**

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gillytech.dev | admin123 |
| Teacher | teacher@gillytech.dev | teacher123 |
| Student (Amara) | amara@gillytech.dev | student123 |
| Student (Kofi) | kofi@gillytech.dev | student123 |
| Student (Zara) | zara@gillytech.dev | student123 |
| Student (Jomo) | jomo@gillytech.dev | student123 |
| + 4 more students | [name]@gillytech.dev | student123 |

**Class codes:**
- Biology (Form 3): `BIO-2024` — active session with 3 questions
- Physics (Form 2): `PHY-2024`

---

## Architecture

```
gillytech/
├── backend/                    Node.js + Express
│   └── src/
│       ├── db/                 lowdb (JSON file database)
│       │   ├── database.js     DB init
│       │   └── seed.js         Demo data
│       ├── middleware/
│       │   └── auth.js         JWT middleware
│       ├── routes/
│       │   ├── auth.js         Login, /me
│       │   ├── teacher.js      Classes, sessions, questions, analytics
│       │   ├── student.js      Join, submit, leaderboard, chat, profile
│       │   └── admin.js        Platform overview
│       ├── websocket.js        Real-time chat & session events
│       └── index.js            Server entry
│
└── frontend/                   React + Vite
    └── src/
        ├── lib/api.js          REST client
        ├── hooks/
        │   ├── useAuth.jsx     Auth context
        │   └── useWebSocket.js WS hook
        ├── components/shared/
        │   └── Sidebar.jsx     Navigation sidebar
        └── pages/
            ├── LoginPage.jsx
            ├── teacher/        Dashboard, NewSession, LiveMonitor, Analytics, Sessions, Classes, QuestionBank
            ├── student/        StudentHome, StudentSession, Profile
            └── admin/          AdminDashboard
```

---

## API reference

### Auth
| | Endpoint | Body |
|--|--|--|
| POST | `/api/auth/login` | `{email, password}` |
| GET | `/api/auth/me` | — |

### Teacher
| | Endpoint |
|--|--|
| GET | `/api/teacher/classes` |
| POST | `/api/teacher/classes` |
| GET | `/api/teacher/classes/:id/students` |
| GET | `/api/teacher/sessions` |
| POST | `/api/teacher/sessions` |
| PATCH | `/api/teacher/sessions/:id` |
| POST | `/api/teacher/sessions/:id/questions` |
| GET | `/api/teacher/sessions/:id/live` |
| GET | `/api/teacher/sessions/:id/analytics` |
| GET/POST | `/api/teacher/question-bank` |

### Student
| | Endpoint |
|--|--|
| GET | `/api/student/join/:code` |
| GET | `/api/student/session/:id/state` |
| POST | `/api/student/session/:id/submit` |
| GET | `/api/student/session/:id/leaderboard` |
| GET | `/api/student/session/:id/chat/:qid` |
| GET | `/api/student/profile` |

### Admin
| | Endpoint |
|--|--|
| GET | `/api/admin/overview` |

---

## WebSocket

Connect: `ws://localhost:3001/ws?sessionId=<id>&token=<jwt>`

| Event | Direction | Payload |
|-------|-----------|---------|
| `connected` | server→client | `{userId, groupId}` |
| `chat` | client→server | `{type, text, questionId}` |
| `chat` | server→client | `{type, message}` |
| `presence` | server→client | `{event: joined/left, userId, name}` |
| `question_advance` | server→client | `{type, index}` |
| `session_update` | server→client | `{type, session}` |

---

## Scoring

| Action | Points |
|--------|--------|
| Correct answer | +8 |
| First correct in class | +2 bonus |
| Reasoning submitted (>20 chars) | +2 |
| **Maximum per question** | **12** |

---

## CBC Competencies tracked

- **Critical thinking & problem solving** — derived from answer accuracy
- **Reasoning quality** — derived from reasoning text length & substance
- **Communication & collaboration** — group chat participation
- **Participation** — question completion rate

---

## Next steps

- [ ] Migrate from lowdb → PostgreSQL for production
- [ ] AI reasoning evaluator (Anthropic API — `claude-sonnet-4-6`)
- [ ] Mobile app (React Native)
- [ ] Adaptive difficulty
- [ ] National competition mode
- [ ] CBC report export to PDF
- [ ] Teacher collaborative question authoring
# gillytech
