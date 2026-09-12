# cicd-learning-app

A practice full-stack project for learning professional GitHub Actions CI/CD deployment, from local development to a live Ubuntu VPS.

## Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Database:** MySQL (installed natively, no Docker)

## Local development

1. Install MySQL Server locally and create a database (see `.env.example` for expected variable names).
2. Copy `.env.example` to `.env` (root), and set up `backend/.env` and `frontend/.env.local` with matching values.
3. Install dependencies: `npm run install:all`
4. Start both apps: `npm run dev`
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000

## Project structure

```
cicd-learning-app/
├── backend/    # Express + TypeScript REST API
├── frontend/   # Next.js dashboard
└── .env.example
```
