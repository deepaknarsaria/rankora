# Rankora AI

**Rankora** is an AI-powered SEO SaaS that helps your content rank on Google and get cited by AI platforms like ChatGPT, Gemini, and Perplexity. It analyzes your website across SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization) — and gives actionable fixes to improve visibility in modern search.

---

## How It Works

1. **Paste your content or URL** on the homepage
2. **Enter your target keywords**
3. Click **"Get My SEO Score"**
4. Get an instant AI-powered report with:
   - SEO / AEO / GEO scores
   - Detected and recommended keywords
   - Prioritized issues (red cards)
   - Opportunities to improve (amber cards)
5. Click **"Fix Everything Automatically"** to get AI-optimized content
6. **Copy or download** the optimized version

---

## Features

- AI analysis across **SEO**, **AEO**, and **GEO**
- Keyword intelligence with difficulty and potential ratings
- Prioritized issue detection with fix suggestions
- One-click AI content optimization
- Before/after score comparison
- File upload support (analyze documents directly)
- JWT-based auth with per-user credit tracking
- PayPal subscription payments (Free / Pro / Premium plans)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Framer Motion |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT |
| Auth | JWT (7-day expiry) + bcrypt |
| Payments | PayPal Subscriptions |
| Monorepo | pnpm workspaces |
| Validation | Zod + drizzle-zod |

---

## Project Structure

```
rankora/
├── artifacts/
│   ├── api-server/       # Express API server
│   └── rank-pilot/       # React frontend
├── lib/
│   ├── api-spec/         # OpenAPI spec + codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas
│   ├── db/               # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/
├── pnpm-workspace.yaml
└── package.json
```

---

## Running Locally

### Prerequisites

- Node.js 24+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### Setup

```bash
# Clone the repo
git clone https://github.com/deepaknarsaria/rankora.git
cd rankora

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, PAYPAL_CLIENT_ID
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis |
| `PAYPAL_CLIENT_ID` | PayPal client ID for payments |

### Run

```bash
# Build all packages
pnpm run build

# Start the API server (from artifacts/api-server)
pnpm --filter @workspace/api-server run start

# Start the frontend (from artifacts/rank-pilot)
pnpm --filter @workspace/rank-pilot run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/healthz` | Health check |
| POST | `/api/signup` | Create account `{ email, password }` |
| POST | `/api/login` | Login `{ email, password }` → JWT |
| GET | `/api/me` | Get current user (requires Bearer token) |
| POST | `/api/analyze` | Analyze content `{ content, keywords? }` — costs 1 credit |
| POST | `/api/optimize` | AI-optimize content `{ content, keywords? }` — costs 2 credits |
| GET | `/api/credits` | Get remaining credits |

---

## Plans & Credits

| Plan | Credits | Price |
|---|---|---|
| Free | 5 credits | Free |
| Pro | More credits | Paid (PayPal) |
| Premium | Unlimited | Paid (PayPal) |

New users get **5 free credits** on signup.

---

## License

MIT
