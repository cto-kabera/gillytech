# Changelog

All notable changes to Gillytech are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning is **alpha** until we cut a stable release (`1.0.0`).

## How to bump

1. Increment `VERSION`, `frontend/package.json`, and `backend/package.json` together.
2. Add a dated section below **before** you commit and push (Vercel + Render deploy from git).
3. Use:
   - **Added** for new capabilities
   - **Changed** for behaviour or rule updates
   - **Fixed** for bug fixes
   - **Removed** for deleted behaviour

Alpha sequence: `1.0.0-alpha.1` → `1.0.0-alpha.2` → … then `1.0.0-beta.1` if needed, then `1.0.0`.

---

## [1.0.0-alpha.1] — 2026-08-25

First alpha of the live stack: Supabase Auth + Postgres + Realtime, Express for trusted writes, Vercel frontend, Render API.

### Added

- Full **Supabase Auth** (no custom password table / login API). Profiles sync `auth.users` → `public.users`.
- **Supabase Realtime** for group chat, question advance, and live submissions (custom WebSocket removed).
- Server-side **reasoning-first scoring** (`submit_reasoned_answer`), including first-correct badges.
- **Subjects catalog**; teachers can teach **multiple subjects**.
- Teacher: assign a **class to a subject**; **question bank per subject**; new-session questions from **bank or new** (new items save to the bank).
- Teacher: **review closed sessions** (analytics, student reasoning, group chats) without reopening them as live.
- Admin: create **users** (teacher + subjects, students, admins), **subjects**, **classes**, **enroll** students (picker or email list), **delete users**.

### Changed

- Session authoring is subject-scoped via the class’s subject.
- Classes are created by admin; teachers assign subject on classes they teach.

### Fixed

- First-correct badge insert no longer references a non-existent `badges.question_id` column.

---

## [1.0.0-alpha.2] — 2026-08-25

### Added

- GitHub Action: apply `supabase/migrations` to the linked cloud project on push to `main`.

### Fixed

- Cloud init no longer tries to `CREATE EXTENSION pgcrypto` (that statement fails on hosted Supabase).
- Renamed RLS helper `current_role()` to `app_user_role()` (clashes with Postgres).

### Unreleased

- (Next work goes here, then promote into `1.0.0-alpha.3` on the next push.)
