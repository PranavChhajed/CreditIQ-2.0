# CreditIQ

A credit-underwriting demo: `packages/shared` (types/schema) → `packages/engine` (pure decision logic) → `packages/api` (Express + SQLite) → `packages/ui` (React).

## Setup

```
npm install
```

## Running the demo

The API and UI run as two separate dev servers. Open two terminals from the repo root:

```
npm run dev -w packages/api
```

```
npm run dev -w packages/ui
```

Then open the UI at **http://localhost:5173**. It proxies `/api` requests to the API server on `http://localhost:3001`.

## Tests

```
npm test
```

Runs each workspace's test suite (`packages/shared`, `packages/engine`, and `packages/ui` via Vitest; `packages/api` via Node's built-in test runner).
