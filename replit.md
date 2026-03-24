# Workspace

## Overview

pnpm workspace monorepo using TypeScript. **RankPilot AI** — an AI-powered content optimization SaaS tool for SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Replit OpenAI AI Integration (gpt-5.2, no user API key needed)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion

## Application

**RankPilot AI** allows users to:
1. Paste content into a textarea
2. Click "Analyze Content" → get SEO, AEO, GEO scores (0-100), issues list, and suggestions
3. Click "Fix Everything" → get AI-optimized content
4. Copy the optimized content to clipboard

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── rank-pilot/         # React frontend (RankPilot AI)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI React hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Endpoints

- `GET /api/healthz` — health check
- `POST /api/analyze` — analyze content for SEO/AEO/GEO (body: `{ content: string }`)
- `POST /api/optimize` — rewrite/optimize content (body: `{ content: string }`)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/rank-pilot` (`@workspace/rank-pilot`)

React + Vite frontend. Single-page app with content input, score cards, issues/suggestions display, and optimized content output.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/content.ts` handle analyze and optimize.

### `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`)

OpenAI server-side client using Replit AI Integrations proxy. No user API key needed.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`
