# Flag Nation — Backend

A stateless Node.js/Express API for the Flag Nation frontend (`flag-nation/`).
This backend was built alongside, but does not modify, the existing React
frontend — it's designed as a drop-in replacement for the current
`localStorage`-based prototype in `src/lib/vibe-store.ts` /
`vibe-context.tsx`. See **Frontend integration** below for how to wire it up.

## Stack

- **Node.js / Express** — REST API
- **MySQL** (via Sequelize) — persistence
- **JWT** (short-lived access token + rotating refresh token) — stateless auth
- **Kafka** (via kafkajs) — decouples notification creation from the request path
- **Nodemailer / Gmail SMTP** — forgot-password emails
- **Docker / docker-compose** — MySQL, Zookeeper, Kafka, API, notification worker

## Why it's stateless

Every API server instance validates a request using only the signed access
JWT — no in-memory session, no sticky sessions needed, any instance can
serve any request. The only server-side state related to auth is the
`refresh_tokens` table, which exists solely to (a) implement the 7-day
"log out after a week of inactivity" requirement and (b) allow revocation
(logout, password change/reset). That's a persistence concern, not a
request-handling one — it doesn't reintroduce server affinity.

## Getting started

```bash
cp .env.example .env
# fill in JWT_ACCESS_SECRET (long random string) and SMTP_PASSWORD
# (a Gmail App Password for hninshweyiwint2022@gmail.com — Gmail requires
# an App Password, not the account password, for SMTP) 
# givw ovku mvla yjqe

docker compose up --build
```

This starts MySQL, Zookeeper, Kafka, the API (`:4000`), and the
notification worker. The API runs its schema sync automatically on boot
(`src/config/migrate.js`) — no manual migration step needed.

Without Docker: `npm install`, run a local MySQL + Kafka, then
`npm run migrate && npm run start` (and `npm run worker` in a second
terminal for notifications).

## Auth model

- **Access token**: JWT, 15 min default expiry, sent as
  `Authorization: Bearer <token>`, returned in every login/register/refresh
  response body — the frontend should hold it in memory (a React context/
  store), not localStorage, to limit XSS blast radius.
- **Refresh token**: opaque random string in an `httpOnly`, `Secure`
  (in production), `SameSite=Lax` cookie scoped to `/api/auth`, hashed
  before being stored in MySQL. `POST /api/auth/refresh` rotates it and
  returns a new access token. Its expiry slides forward 7 days on every
  successful refresh — so a user who keeps using the site never gets
  logged out, but one who's inactive for 7 days does, exactly per spec.
- Because the refresh cookie is `httpOnly`, the frontend can't read it —
  it just needs to call `/api/auth/refresh` with `credentials: "include"`
  on startup / on a 401, to get a fresh access token silently. That's also
  what makes **"stay on the current page on refresh"** work: the page
  reloads, the app calls `/refresh`, restores the access token, and
  the already-loaded route just re-renders authenticated — no forced
  redirect to `/login`.

## API reference

All routes are prefixed `/api`. Request/response bodies are JSON.

### Auth (`/api/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | – | unique username + email enforced |
| POST | `/login` | – | grants daily karma if not yet granted today |
| POST | `/refresh` | refresh cookie | rotates session |
| POST | `/logout` | – | revokes current refresh token |
| GET | `/me` | required | |
| POST | `/forgot-password` | – | `{ email }` → 404 with a clear message if not registered, otherwise emails a reset link |
| POST | `/reset-password` | – | `{ token, newPassword }`, revokes all sessions |
| POST | `/change-password` | required | `{ currentPassword, newPassword }`, revokes all other sessions |

### Posts (`/api/posts`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | optional | `?page&limit&category` |
| GET | `/hall/:flag` | – | `flag` = red\|green\|black, top posts by that flag |
| GET | `/:id` | optional | |
| POST | `/` | required | moderated (no @mentions, profanity, emails, phone numbers) |
| DELETE | `/:id` | required, owner only | soft delete |
| POST | `/:id/vote` | required | `{ type: red\|green\|black }`, one vote per user, notifies author + checks milestone/achievement |
| POST | `/:id/report` | required, not own post | `{ reason }` |
| GET | `/:id/comments` | – | |
| POST | `/:id/comments` | required | `{ content, parentId? }` |

### Comments (`/api/comments`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| PATCH | `/:id` | required, owner only | edit |
| DELETE | `/:id` | required, owner only | deletes comment + its reply thread |
| POST | `/:id/react` | required | `{ reactionKey }`, one reaction per user, notifies comment author |

### Users (`/api/users`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/leaderboard` (also `/api/leaderboard`) | – | top 50 by karma |
| GET | `/:username` | – | public profile + their posts |
| PATCH | `/me` | required | `{ username?, avatar? }` |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | required | newest first, includes `unreadCount` |
| POST | `/:id/read` | required | |
| POST | `/read-all` | required | |

Each notification includes `postId`/`commentId` so the frontend can route
directly to the relevant post on click, and `type` (`like_post`,
`like_comment`, `reply_comment`, `post_milestone`, `achievement`) plus a
ready-to-display `message` so the UI doesn't need its own copy logic.

## Reliability & security notes

- `helmet`, scoped `cors` (only `CLIENT_URL`, `credentials: true`), and
  tiered rate limiting (general / auth / forgot-password) are on by default.
- Passwords hashed with bcrypt (12 rounds); refresh & reset tokens are
  stored only as SHA-256 hashes, never in plaintext.
- All input is validated with Joi before touching the database; all
  queries go through Sequelize (parameterized), no raw string interpolation.
- Login and forgot-password intentionally differ in error specificity:
  login returns one generic "incorrect username/email or password" (no
  account enumeration), while forgot-password does confirm whether an
  email is registered, per the spec's explicit requirement — this is a
  deliberate product tradeoff, not an oversight.
- Server-side moderation (`src/services/moderation.service.js`) is
  authoritative and re-checks everything the frontend already checks
  (profanity, emails, phone numbers) plus blocks `@mentions` outright,
  since a client-side-only check can always be bypassed by calling the
  API directly.
- Kafka publish failures never fail the triggering user action (voting,
  commenting, reacting always succeed even if Kafka/the notification
  worker is briefly down) — see comments in `src/kafka/producer.js`.
- Graceful shutdown on `SIGTERM`/`SIGINT`; Docker healthchecks on both
  MySQL and the API container.

## Design notes / assumptions made

- **Daily karma**: granted at most once per UTC calendar day, checked via
  `lastKarmaDate` equality (not a rolling 24h timer) — matches "not every
  time they log in/out within the same day", and also fires on any
  authenticated request via `dailyKarmaTouch` middleware so it also
  covers "or open/use the website" for already-logged-in users.
- **"Flag Detective" (100 helpful votes)**: interpreted as 100 flag votes
  *cast* by the user (i.e. they've helped flag 100 situations). Adjust
  `src/services/achievement.service.js` if a different definition (e.g.
  votes that matched the post's eventual majority) is intended.
- **Post milestones**: notifies at 100 / 500 / 1,000 / 5,000 / 10,000
  total votes on a post — the spec's example was 1k, the rest are a
  reasonable extrapolation.
- **One reaction per user per comment**: matches the existing frontend
  behavior in `toggleReaction` (picking a new reaction moves it).

## Frontend integration

The frontend now talks to this API instead of `localStorage`. What changed,
all inside `flag-nation/src/`:

- **`lib/api.ts`** *(new)* — fetch wrapper. Holds the access token in
  memory (not localStorage, to limit XSS blast radius), sends
  `credentials: "include"` on every request so the httpOnly refresh
  cookie goes along, and transparently refreshes + retries once on a 401
  (the access token's normal 15-minute expiry shouldn't surface as an
  error to callers).
- **`lib/vibe-context.tsx`** *(rewritten)* — every `store.*`
  localStorage call replaced with a call through `api.ts`. On mount it
  calls `/api/auth/refresh` to restore the session from the cookie
  *before* anything renders as logged-out — that's what makes a browser
  refresh keep you on the current page instead of bouncing to `/login`.
  Same public interface (`useVibe()` returns the same shape), so every
  component consuming it needed zero changes.
- **`lib/vibe-store.ts`** *(trimmed)* — the localStorage "database"
  (demo data, `seedIfNeeded`, the `store` object) was removed since the
  API owns persistence now. All types and pure helpers
  (`levelFor`, `karmaProgress`, `totalVotes`, `commentCount`, `moderate`,
  etc.) are untouched — every other component still imports these
  unchanged.
- **`GET /api/users`** *(new backend endpoint)* — added because there
  was no existing way to back the frontend's username search/leaderboard
  widgets. Returns up to 100 users ranked by karma, with an optional `?q=`
  prefix filter. This is a genuine simplification versus a real "all
  users" listing — fine at demo scale, worth revisiting (real pagination,
  a dedicated search index) before this goes to real users.
- A handful of call sites (`login.tsx`, `register.tsx`,
  `CreatePostDialog.tsx`, `CommentThread.tsx`) needed `await` added since
  `login`/`register`/`createPost`/`addComment` are real network calls now
  instead of synchronous localStorage writes — otherwise `res.ok` would
  be checked on an unresolved `Promise` instead of the actual result.
- `CommentThread.tsx`'s reply composer used to prefix replies with
  `@{authorName}` for a Facebook-style "replying to" look. That's a
  literal `@mention` and the spec explicitly forbids mentioning other
  users in post/comment content (the API rejects it), so that prefix was
  removed — replies now send exactly what the user typed. This does mean
  flattened reply threads lose the inline "@Name" visual cue; a
  non-mention way to show that (e.g. a small "replying to X" label
  rendered above the textbox, not embedded in the saved content) would
  need a small UI addition if that affordance is wanted back.

Not wired up (out of scope for this pass, left as-is):
- `routes/notifications.tsx` still renders a hardcoded mock notification
  list — it never read from `vibe-context` to begin with. The backend's
  `/api/notifications` endpoints are ready; wiring this page to them is a
  self-contained follow-up.
- There's no "Delete post" entry in `PostCard.tsx`'s post menu yet (only
  "Report post"). `deletePost()` was added to `vibe-context.tsx` and maps
  straight to `DELETE /api/posts/:id`, so adding the menu item is a small
  follow-up whenever you want it.
