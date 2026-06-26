# AGENTS.md

## Project overview

The assignment is to build an **AI Coding Agent Battle Royale**: a browser-based spectator game where humans submit programming challenges and AI coding agents compete to answer them. Humans do not compete directly. Humans only spectate, submit challenges, and, if they are an admin, configure/start/reset the battle.

The product should feel like a lightweight live game. An admin starts a battle with a configured number of AI competitors. Spectators submit programming challenges with known answers. For each challenge, a subset of AI competitors is selected for a skirmish. The selected agents race to solve the challenge by generating and executing code. Competitors are eliminated based on correctness and speed until one winner remains.

The goal is not to build a production-scale platform. The goal is to ship a functioning, deployed MVP that demonstrates good product judgment, clean architecture, safe-enough engineering tradeoffs, and reliable core game logic within a one-day constraint.

## Assignment summary

There are two user types:

### Spectator

A spectator:

* Has a username, but does not need an account or password.
* Can view the active battle.
* Can submit challenges to an active battle.
* Can enqueue challenges for the next battle if no battle is active.

### Admin

An admin:

* Can do everything a spectator can do.
* Must be logged in.
* Can configure a battle, such as number of competitors.
* Can start/reset a battle.
* Can delete or clear enqueued challenges.

For this MVP, single-admin support is acceptable.

## Challenge format

A challenge is a programming question with a known expected answer.

Examples:

* Question: `What is the md5sum of "AI Battle Royale"?`

  * Answer: `4359c152baed9981d7b783b6a8bf2704`
* Question: `What is the base-16 representation of 255^10?`

  * Answer: `0xf62c88d104d1882cf601`
* Question: `What is 123456789 * 987654321?`

  * Answer: `121932631112635269`
* Question: `What is 7^77 mod 999999937?`

  * Answer: `860842589`
* Question: `What is the sum of the ASCII values of every character in "The quick brown fox jumps over the lazy dog"?`

  * Answer: `4057`

For the MVP, spectators submit both:

* `question`
* `expectedAnswer`

Answer checking should trim whitespace but otherwise use exact string comparison.

## Gameplay rules

When a challenge is submitted during an active battle:

1. Select 2-4 alive competitors randomly for a skirmish.
2. Each selected competitor attempts to answer the challenge.
3. Competitors race concurrently within the skirmish.
4. Each competitor must submit a correct answer within the timeout.
5. Any competitor who submits an incorrect answer is eliminated.
6. Any competitor who times out or errors is eliminated.
7. If all competitors submit the correct answer within the timeout, the slowest competitor is eliminated.
8. If all selected competitors would be eliminated, the skirmish is canceled and nobody is eliminated. This prevents bad/impossible challenges from wiping out the game.
9. Skirmishes continue until only one competitor remains.
10. The final remaining competitor is crowned the winner.

## Intentional MVP architecture decisions

These are deliberate constraints for the 24-hour project:

1. Use TypeScript throughout the project.
2. Use Node/Express for the backend.
3. Use Vite/React for the frontend.
4. Use in-memory state for the active battle.
5. Deploy on Railway as a long-running backend service.
6. Do not design around serverless functions losing in-memory state.
7. Use polling for the frontend live updates.
8. Treat WebSockets as a stretch goal only after the core product is stable.
9. Only one skirmish may run at a time.
10. Agents within a single skirmish may run concurrently.
11. Support `AGENT_MODE=mock` first.
12. Add `AGENT_MODE=llm` later, after the game loop works.
13. Generated code execution should be simplified for the MVP:

    * strict timeout
    * output limits
    * no secrets exposed to generated code
    * honest README notes that this is not production-grade sandboxing
14. Avoid overengineering. Prefer a reliable deployed MVP over a larger fragile product.

## Repository structure

The repo uses an `apps` layout:

```txt
ai-battle-royal/
  AGENTS.md
  package.json
  apps/
    server/
      package.json
      tsconfig.json
      src/
    client/
      package.json
      vite.config.ts
      src/
```

## Backend conventions

Backend lives in:

```txt
apps/server
```

Preferred backend structure:

```txt
apps/server/src/
  server.ts
  config.ts
  types.ts
  battle/
  agents/
  execution/
  utils/
```

Backend rules:

* Keep game rules out of Express route handlers.
* Express routes should call service functions.
* Keep elimination logic pure and testable.
* Keep battle/skirmish state transitions explicit.
* Store active game state in memory.
* Do not add Postgres, Redis, Prisma, or another database unless explicitly requested.
* Do not add WebSockets unless explicitly requested.
* Do not implement multiple battles or rooms.
* Add tests around the core battle/skirmish logic.
* Prefer boring, readable TypeScript over clever abstractions.

## Frontend conventions

Frontend lives in:

```txt
apps/client
```

Preferred frontend structure:

```txt
apps/client/src/
  App.tsx
  main.tsx
  styles.css
  api/
  hooks/
  types/
  components/
```

Frontend rules:

* Use polling against `GET /api/state`.
* Keep UI simple, readable, and demo-friendly.
* Do not add Redux, Zustand, or complex client-side state management unless explicitly requested.
* Do not add WebSockets unless explicitly requested.
* Do not add a design system unless explicitly requested.
* Prioritize clarity of the battle state, competitor status, skirmish results, and event log.

## Core backend API shape

Expected routes:

```txt
GET  /api/health
GET  /api/state

POST /api/challenges

POST /api/admin/config
POST /api/admin/start
POST /api/admin/reset
POST /api/admin/clear-queue
```

Admin routes should use a simple header-based password check:

```txt
x-admin-password: <ADMIN_PASSWORD>
```

The password should come from environment variables and must not be exposed to the frontend except through user input.

## Commands

From repo root:

```bash
npm run dev:server
npm run dev:client
npm run build
```

From `apps/server`:

```bash
npm run dev
npm run build
```

From `apps/client`:

```bash
npm run dev
npm run build
```

## Environment variables

Server env vars:

```txt
PORT=3000
ADMIN_PASSWORD=dev-admin-password
AGENT_MODE=mock
SKIRMISH_TIMEOUT_MS=60000
CODE_TIMEOUT_MS=3000
MAX_OUTPUT_BYTES=4096
```

Client env vars:

```txt
VITE_API_BASE_URL=http://localhost:3000
```

## Recommended development order

Work in small, reviewable slices:

1. Backend domain types and pure elimination rules.
2. Tests for elimination rules.
3. In-memory store and battle service.
4. Mock agents and skirmish runner.
5. Express API routes.
6. Frontend polling UI.
7. Railway deployment readiness.
8. LLM agent mode.
9. Simplified code execution.

Do not jump directly to building the whole app.

## What done means

A slice is done when:

* The relevant code is implemented.
* The implementation follows the MVP constraints above.
* No unrelated features were added.
* Any important limitations are called out.

For backend changes, run the server build.

For frontend changes, run the client build.

For full-stack changes, run root-level build commands if available.

## Non-goals

Do not implement these unless explicitly asked:

* Multiple simultaneous battles
* Multiple rooms/lobbies
* Full spectator authentication
* OAuth
* Password reset
* Complex admin roles
* Persistent database
* WebSockets
* Full replay mode
* Complex tournament brackets
* Long-term leaderboards
* Advanced agent memory
* Multiple LLM providers
* Production-grade sandboxing
* Payment/accounts/team features

## Quality bar

Prioritize:

* A working deployed product
* Correct battle/skirmish rules
* Clear and testable state transitions
* Simple architecture
* Good error handling
* A demo-friendly UI
* Honest documentation of tradeoffs

## Important implementation note

The first working version should use `AGENT_MODE=mock`.

Mock mode should make the full battle loop testable without depending on LLM calls or code execution. Only after the mock battle loop works should `AGENT_MODE=llm` and generated-code execution be added.
