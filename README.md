# Runway

**Stop reading API docs. Start making requests.**

Ever spent 30 minutes just trying to figure out how to authenticate with a new API? Runway fixes that. Paste an OpenAPI spec, get a working request in 10 seconds.

## The Problem

You find an API you want to use. The docs have 200 endpoints. You scroll through looking for the auth section. You find three different authentication methods. You're not sure which one applies to your use case. You copy some curl command, replace the placeholders, get a 401. Try again. Another 401. Check the headers. Realize you needed a different auth scheme.

Sound familiar?

## The Solution

Runway reads the OpenAPI spec and does the work for you:

- **Finds the simplest endpoint** - Usually something like `/health`, `/me`, or `/users` that you can hit right away
- **Figures out the auth** - API key? Bearer token? OAuth2? Runway detects it and tells you exactly what to set
- **Generates working code** - Copy-paste curl, JavaScript, or Python. No placeholders to guess at.
- **Test it live** - Hit the API directly from your browser and see the response

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and paste any OpenAPI spec URL.

Try it with the PetStore API:
```
https://petstore3.swagger.io/api/v3/openapi.json
```

## How It Works

```
You paste a spec URL
        ↓
Server fetches and parses it (all the heavy work)
        ↓
You get a Quick Start guide with:
   • Auth setup instructions
   • Working code snippets
   • Interactive API tester
```

The parsing happens server-side using React Server Components. Your browser only gets the final result - no huge OpenAPI specs being shipped to the client.

## Built With

- Next.js 16 (App Router, RSC, Turbopack)
- TypeScript
- Tailwind CSS + shadcn/ui
- @readme/openapi-parser

## License

MIT
