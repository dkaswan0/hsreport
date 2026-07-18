# High Safety International Center — مركز الأمان العالي الدولي

A vehicle inspection management system for High Safety International Center. Built with React + Express + TypeScript + PostgreSQL (Drizzle ORM).

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, TanStack Query, Wouter (routing), Framer Motion
- **Backend**: Express.js (Node 20), TypeScript (`tsx` runner), session-based auth
- **Database**: PostgreSQL (Drizzle ORM) — Replit's built-in managed PostgreSQL
- **AI**: OpenAI (lazy-initialized, requires `AI_INTEGRATIONS_OPENAI_API_KEY`)

## How to run

```bash
npm install
npm run dev        # Development server on port 5000
npm run build      # Production build
npm start          # Production server
npm run db:push    # Apply schema changes to the database
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (auto-set by Replit) |
| `SESSION_SECRET` | ✅ Yes | Express session secret (set in Replit Secrets) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | ⚠️ Optional | OpenAI API key — AI features disabled without it |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ⚠️ Optional | Custom OpenAI base URL |
| `ADMIN_USERNAME` | ⚠️ Optional | Admin login username (default: `hs`) |
| `ADMIN_PASSWORD` | ⚠️ Optional | Admin login password (default: `ahmed`) |
| `EMAIL_USER` | ⚠️ Optional | SMTP email user for notifications |
| `EMAIL_PASS` | ⚠️ Optional | SMTP email password |

## Known setup notes

- **jspdf** is blocked by Replit's security policy (critical CVE in all published versions). A local stub at `client/src/lib/jspdf-stub.ts` replaces it via a Vite alias. PDF download shows a user-friendly error. This will be addressed in the security/refactor phase.
- **OpenAI client** is lazy-initialized — the server starts normally even without an API key. AI features return errors when called without the key.

## Project structure

```
├── client/          Frontend React app
│   └── src/
│       ├── pages/   Route-level pages
│       ├── components/  Reusable UI components
│       └── lib/     Utilities, PDF builder, query client
├── server/          Express backend
│   ├── index.ts     Server entry point
│   ├── routes.ts    All API routes
│   ├── db.ts        Drizzle DB connection
│   ├── storage.ts   Database access layer
│   └── replit_integrations/  OpenAI chat & image integrations
├── shared/          Shared types, schema, routes
└── drizzle.config.ts  DB migration config
```

## User Preferences

- Perform improvements in phases; verify the app works after each phase before moving on
- Fix all errors immediately when they appear — don't leave broken states
- Preserve all existing features and backward compatibility throughout any refactor
- Write a report at the end of each phase summarizing what changed
