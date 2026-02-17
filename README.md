# Runway ✈️

**Stop reading API docs. Start making requests.**

Ever spent 30 minutes just trying to figure out how to authenticate with a new API? Runway fixes that. Paste an OpenAPI spec, get a working request in 10 seconds.

![Runway Quick Start Guide](public/screenshots/quickstart.png)

## 😩 The Problem

You find an API you want to use. The docs have 200 endpoints. You scroll through looking for the auth section. You find three different authentication methods. You're not sure which one applies to your use case. You copy some curl command, replace the placeholders, get a 401. Try again. Another 401. Check the headers. Realize you needed a different auth scheme.

Sound familiar?

## ✨ The Solution

Runway reads the OpenAPI spec and does the work for you:

- 🎯 **Finds the simplest endpoint** - Usually something like `/health`, `/me`, or `/users` that you can hit right away
- 🔐 **Figures out the auth** - API key? Bearer token? OAuth2? Runway detects it and tells you exactly what to set
- 📋 **Generates working code** - Copy-paste curl, JavaScript, or Python. No placeholders to guess at.
- ⚡ **Test it live** - Hit the API directly from your browser and see the response

## 🚀 Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and paste any OpenAPI spec URL.

![Landing Page](public/screenshots/landing.png)

Try it with these APIs:
- **HTTPBin**: `https://httpbin.org/spec.json`
- **PetStore**: `https://petstore3.swagger.io/api/v3/openapi.json`

## 🔄 How It Works

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

## ⚡ Try It Live

Test any endpoint directly from your browser. No need to open a terminal or Postman.

![Try It Panel](public/screenshots/tryit.png)

## 🛠️ Built With

- **Next.js 16** - App Router, React Server Components, Turbopack
- **TypeScript** - Type safety throughout
- **Tailwind CSS + shadcn/ui** - Clean, modern UI
- **Biome** - Fast linting and formatting
- **@readme/openapi-parser** - Robust spec parsing
- **pnpm** - Fast, disk-efficient package manager

## 📁 Project Structure

```
src/
├── app/
│   ├── api/parse/       # Server-side spec parsing
│   ├── api/proxy/       # CORS proxy for Try It
│   └── page.tsx         # Main page
├── components/          # UI components
└── lib/openapi/         # Parsing and code generation
```

## 📄 License

MIT
