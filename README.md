# Salesforce Validation Rules Manager

A web app to log in to a Salesforce org via OAuth 2.0 and manage Account-object validation rules — list, toggle individually or in bulk, and deploy changes — without opening Salesforce Setup.

## Live demo

| | URL |
|---|---|
| **Frontend** (Vercel) | https://salesforce-validation-rules-manager.vercel.app |
| **Backend** (AWS EC2 → ngrok tunnel) | https://geology-effort-suitor.ngrok-free.dev |
| **Repository** | https://github.com/GoyalDiya/Salesforce_Validation_Rules_Manager |

> **One-time browser warning:** the backend runs through a free ngrok tunnel, so when you click **Connect to Salesforce** the browser may show a "You are about to visit..." page once. Click **Visit Site** to continue — your browser will remember and skip it on later requests.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + react-router-dom + axios
- **Backend:** Node 20 + Express 5 + jsforce + express-session
- **Salesforce APIs:** OAuth 2.0 Web Server Flow, Tooling API (`ValidationRule.Metadata`)
- **Hosting:** Vercel (frontend), AWS EC2 t3.micro Ubuntu 24.04 + ngrok (backend), PM2 + systemd (process supervision)

## Architecture

```
┌────────────────────┐     OAuth + REST     ┌─────────────────────┐
│  React (Vercel)    │ ◄──────────────────► │  Express (EC2/ngrok)│
└────────────────────┘   credentialed XHR   └─────────────────────┘
                                                       │
                                                       │ jsforce — OAuth + Tooling API
                                                       ▼
                                            ┌──────────────────────┐
                                            │  Salesforce dev org  │
                                            └──────────────────────┘
```

The browser never sees Salesforce tokens — Express holds them server-side and proxies API calls. Session cookies are `HttpOnly + Secure + SameSite=None` so they survive the cross-origin Vercel↔ngrok hop.

## Project structure

```
Salesforce_Validation_Rules_Manager/
├── client/                    React frontend
│   └── src/
│       ├── api/               axios client + Salesforce API helpers
│       ├── components/        Reusable UI (RulesTable, ToggleSwitch, BulkActions, …)
│       ├── context/           AuthContext + useAuth hook
│       └── pages/             LoginPage, DashboardPage
└── server/                    Express backend
    └── src/
        ├── config.js          Env loader + validator
        ├── index.js           Express app entry, session, CORS, mounts
        ├── salesforce.js      jsforce connection helper with token-refresh listener
        ├── middleware/        requireAuth, errorHandler (Salesforce-aware)
        └── routes/            auth, me, rules
```

## Try it (for reviewers)

The app is multi-tenant — it reads validation rules from whichever Salesforce org you log into. To test it end-to-end you need an org with at least one Account validation rule.

### Quickest path: use a free Salesforce Developer Edition org

1. **Sign up** for a free org at https://developer.salesforce.com/signup. Activation takes ~2 minutes (verify the email and set a password).
2. **Create 2–3 simple Account validation rules** in Setup → Object Manager → Account → Validation Rules → **New**.
   - Example: `Phone_Required` — Active ✅, Formula `ISBLANK(Phone)`, Error message "Phone number is required."
   - Example: `Industry_Required` — Active ❌, Formula `ISBLANK(TEXT(Industry))`, Error message "Please select an Industry." (leave inactive so you can test toggling it on)
3. **Open** https://salesforce-validation-rules-manager.vercel.app/.
4. Click **Connect to Salesforce** → click through the one-time ngrok warning → log in with your dev-org credentials → **Allow** on the consent screen.
5. The dashboard shows the rules you just created.

### Walking through the features

| Test | Expected |
|---|---|
| Toggle a single rule's switch | Row turns amber, "Pending" pill appears, header shows "1 unsaved change". **Nothing is written to Salesforce yet.** |
| Click **Activate All** / **Deactivate All** | All rows whose state would change turn amber |
| Click **Discard Changes** | Pending state cleared, switches snap back to original |
| Make changes → click **Deploy** | Spinner in button → green "Deployed N changes to Salesforce." → refresh the Salesforce Setup → Validation Rules page → changes are live in the org |
| Click **Refresh** | Re-fetches from Salesforce, discards any local pending state |
| Click **Logout** | Session cleared, lands back on login page; visiting `/dashboard` directly redirects to `/` |

## Local development

### Prerequisites

- Node.js >= 20
- A Salesforce dev org with a Connected App (or External Client App) configured:
  - **Callback URL:** `http://localhost:3000/auth/callback`
  - **OAuth scopes:** `api`, `refresh_token`, `offline_access`, `full`
  - **PKCE requirement:** disabled (we use the confidential-client flow with `client_secret`)

### Setup

```bash
git clone https://github.com/GoyalDiya/Salesforce_Validation_Rules_Manager.git
cd Salesforce_Validation_Rules_Manager
cd client && npm install
cd ../server && npm install
```

Create `server/.env` (see `server/.env.example` for the template):

```
SF_CLIENT_ID=<your Connected App consumer key>
SF_CLIENT_SECRET=<your Connected App consumer secret>
SF_LOGIN_URL=https://login.salesforce.com
SF_CALLBACK_URL=http://localhost:3000/auth/callback
SESSION_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

Run both halves:

```bash
# Terminal 1
cd server && npm run dev          # http://localhost:3000

# Terminal 2
cd client && npm run dev          # http://localhost:5173
```

Open `http://localhost:5173/`, click **Connect to Salesforce**, and you'll be in.

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/login` | Redirects to Salesforce authorize URL with CSRF state |
| `GET` | `/auth/callback` | Exchanges code for tokens, stores session, redirects to frontend |
| `POST` | `/auth/logout` | Revokes token at Salesforce, destroys session |
| `GET` | `/api/me` | Returns the signed-in user (401 if no session) |
| `GET` | `/api/validation-rules` | Lists Account validation rules from Tooling API |
| `POST` | `/api/validation-rules/deploy` | Body: `{ changes: [{ id, active }, ...] }`. Applies pending toggles to Salesforce |
| `GET` | `/health` | Liveness probe |

All `/api/*` routes require an authenticated session. Toggles in the UI mutate local state only — nothing is written to Salesforce until **Deploy** is clicked, matching the assignment's intent.

## Implementation note: Tooling API quirk

`ValidationRule.Active` is not directly writable. To toggle a rule:

1. `conn.tooling.sobject('ValidationRule').retrieve(id)` — fetches the full `Metadata` object
2. Mutate `rule.Metadata.active`
3. `conn.tooling.sobject('ValidationRule').update({ Id, Metadata: rule.Metadata })` — writes the full metadata back

Sending only `{ Metadata: { active: false } }` would wipe the formula and error message, so the entire `Metadata` object must be round-tripped.

## Deployment notes

The current production setup:

- **Frontend** is built by Vercel from `client/`. The Vite build picks up `VITE_API_BASE_URL` (set in the Vercel dashboard) so axios knows where to send requests in production.
- **Backend** runs on an AWS EC2 t3.micro (Ubuntu 24.04) supervised by PM2. A second PM2 process runs `ngrok http 3000`, exposing the Express server publicly over HTTPS without needing a custom domain or TLS cert. PM2 is registered as a systemd unit so both processes restart on reboot.
- **Cross-origin cookies:** because the frontend (Vercel) and backend (ngrok) live on different domains, the session cookie is set with `SameSite=None; Secure`. `app.set('trust proxy', 1)` lets Express respect the `X-Forwarded-Proto` header from the ngrok edge so secure-cookie checks pass.
- **Session store:** in-memory (`MemoryStore`). Acceptable for a single-instance demo. For real production, swap in `connect-redis` or `connect-sqlite3` so sessions survive restarts.
- **Connected App callback list** must include both the local and production callback URLs:
  ```
  http://localhost:3000/auth/callback
  https://geology-effort-suitor.ngrok-free.dev/auth/callback
  ```

## Alternative deploy approach

`/api/validation-rules/deploy` currently iterates the pending changes and updates each rule's `Metadata` via the Tooling API. A more Salesforce-canonical approach would build a `package.xml` plus zipped `.validationRule-meta.xml` files and call `conn.metadata.deploy()` for an atomic deployment. The simpler iterative path was chosen because it has fewer moving parts and surfaces per-rule failures more clearly; the canonical approach is left as a future enhancement.
