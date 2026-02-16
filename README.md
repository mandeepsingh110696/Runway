# Runway

Get from OpenAPI docs to your first working API call in under a minute.

## What it does

Runway takes an OpenAPI or Swagger spec and generates a focused Quick Start guide. No more digging through hundreds of endpoints to figure out how to authenticate and make your first request.

Paste a spec URL, and Runway will:
- Pick the simplest endpoint to test (like `/health`, `/me`, or `/ping`)
- Detect the authentication method and show you how to set it up
- Generate ready-to-use code snippets in curl, JavaScript, and Python
- Let you test the API directly in the browser

## How it works

**1. Input** — You paste an OpenAPI spec URL or raw JSON

**2. Server parses the spec** — The API route (`/api/parse`) uses `@readme/openapi-parser` to validate and dereference the spec. This runs entirely on the server as a React Server Component pattern.

**3. Smart endpoint selection** — The `endpoint-picker` scores all endpoints and picks the one that's easiest to test. It prefers GET requests, endpoints with no required parameters, and common patterns like `/health` or `/users/me`.

**4. Auth detection** — The `auth-detector` reads the security schemes from the spec and figures out if you need an API key, Bearer token, Basic auth, or OAuth2. It generates the exact setup instructions.

**5. Code generation** — The `snippet-generator` builds working code for curl, JavaScript fetch, and Python requests. All the auth headers and placeholders are filled in.

**6. Output** — You see a clean Quick Start guide with copy-paste snippets and an interactive tester.

## Data flow

```
User Input (URL or JSON)
       │
       ▼
┌──────────────────────┐
│  /api/parse (Server) │  ← Runs on server only
│  - Fetch + validate  │
│  - Dereference $refs │
│  - Pick best endpoint│
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Client Component    │  ← Receives minimal data
│  - Display guide     │
│  - Generate snippets │
│  - Handle Try It     │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  /api/proxy (Server) │  ← CORS proxy for Try It
│  - Forward request   │
│  - Return response   │
└──────────────────────┘
```

The heavy lifting (parsing, validation, dereferencing) happens on the server. The client only receives the processed data it needs to render the UI.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Try it with these APIs

- PetStore: `https://petstore3.swagger.io/api/v3/openapi.json`
- Or paste any OpenAPI 3.x or Swagger 2.x spec

## Tech stack

- Next.js 16 with App Router and React Server Components
- TypeScript
- Tailwind CSS and shadcn/ui
- @readme/openapi-parser for spec parsing

## Project structure

```
src/
├── app/
│   ├── api/parse/       # Server-side spec parsing
│   ├── api/proxy/       # CORS proxy for Try It
│   ├── page.tsx         # Main page (client component)
│   └── layout.tsx       # Root layout (server component)
├── components/
│   ├── spec-input.tsx   # URL/JSON input form
│   ├── quick-start-guide.tsx
│   ├── code-block.tsx
│   ├── endpoint-selector.tsx
│   └── try-it-panel.tsx
└── lib/openapi/
    ├── parser.ts        # Parse and validate specs
    ├── endpoint-picker.ts
    ├── auth-detector.ts
    └── snippet-generator.ts
```

## License

MIT
