# Salesforce Validation Rules Manager

A web app to log in to a Salesforce org via OAuth 2.0 and manage Account-object validation rules — list, toggle individually, bulk-toggle, and deploy — without opening Salesforce Setup.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + react-router-dom + axios
- **Backend:** Node + Express 5 + jsforce + express-session
- **Salesforce APIs:** OAuth 2.0 Web Server Flow, Tooling API (`ValidationRule.Metadata`)

## Architecture

```
React (5173/5174)  ─►  Express (3000)  ─►  Salesforce (login.salesforce.com)
                       owns OAuth tokens     org instance
```

The browser never sees Salesforce tokens — the backend holds them server-side and proxies API calls.

## Project structure

```
Salesforce_Validation_Rules_Manager/
├── client/                    React frontend
│   └── src/
│       ├── api/               axios client + Salesforce API helpers
│       ├── components/        Reusable UI (RulesTable, ToggleSwitch, etc.)
│       ├── context/           AuthContext
│       └── pages/             LoginPage, DashboardPage
└── server/                    Express backend
    └── src/
        ├── config.js          Env loader + validator
        ├── index.js           Express app entry
        ├── salesforce.js      jsforce connection helper
        ├── middleware/        requireAuth, errorHandler
        └── routes/            auth, me, rules
```

## Prerequisites

- Node.js >= 20
- A Salesforce Developer Edition org (free at https://developer.salesforce.com/signup)
- An External Client App (or Connected App) configured in your org with:
  - **Callback URL:** `http://localhost:3000/auth/callback`
  - **OAuth scopes:** `api`, `refresh_token`, `offline_access`, `full`
  - **PKCE requirement:** disabled (we use the confidential-client flow with `client_secret`)

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd Salesforce_Validation_Rules_Manager

cd client && npm install
cd ../server && npm install
```

### 2. Configure backend env

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in:

| Variable | Where to get it |
|---|---|
| `SF_CLIENT_ID` | Salesforce → External Client App → OAuth Settings → Consumer Key |
| `SF_CLIENT_SECRET` | Same screen → Consumer Secret |
| `SF_LOGIN_URL` | `https://login.salesforce.com` (use `https://test.salesforce.com` for sandboxes) |
| `SF_CALLBACK_URL` | Must match your connected-app callback exactly |
| `SESSION_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLIENT_ORIGIN` | Where the React app runs — `http://localhost:5173` for dev |

### 3. Run both servers

```bash
# Terminal 1
cd server && npm run dev          # http://localhost:3000

# Terminal 2
cd client && npm run dev          # http://localhost:5173 (or 5174)
```

Open the React app, click **Connect to Salesforce**, log in, and you'll land on the dashboard.

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/login` | Redirects to Salesforce authorize URL |
| `GET` | `/auth/callback` | Exchanges code for tokens, sets session |
| `POST` | `/auth/logout` | Revokes token, destroys session |
| `GET` | `/api/me` | Returns the current user (401 if not logged in) |
| `GET` | `/api/validation-rules` | Lists Account validation rules |
| `POST` | `/api/validation-rules/deploy` | Body: `{ changes: [{ id, active }, ...] }` — applies pending changes to Salesforce |
| `GET` | `/health` | Liveness probe |

All `/api/*` routes require an authenticated session. Toggles in the UI update local state only — nothing is written to Salesforce until **Deploy** is clicked.

## Try it (for reviewers)

The app is multi-tenant — it reads validation rules from whichever Salesforce org you log into. To test it end-to-end you need an org with at least one Account validation rule.

### Quickest path: use a free Developer Edition org

1. **Sign up** for a free Salesforce Developer Edition org at https://developer.salesforce.com/signup. Activation takes ~2 minutes (verify the email and set a password).
2. **Create 2–3 simple validation rules on the Account object:**
   - In Setup → Object Manager → Account → Validation Rules → **New**
   - Example #1
     - Rule Name: `Phone_Required`
     - Active: ✅
     - Error Condition Formula: `ISBLANK(Phone)`
     - Error Message: `Phone number is required.`
     - Error Location: Field: Phone
   - Example #2
     - Rule Name: `Industry_Required`
     - Active: ❌ (leave inactive — useful for testing the toggle)
     - Error Condition Formula: `ISBLANK(TEXT(Industry))`
     - Error Message: `Please select an Industry.`
     - Error Location: Field: Industry
3. **Open the deployed app** (URL shared in the submission email).
4. Click **Connect to Salesforce** → log in with your dev-org credentials → click **Allow** on the consent screen.
5. The dashboard will show the rules you just created.

### Walking through the features

| Test | Expected |
|---|---|
| Toggle a single rule's switch | Row turns amber, "Pending" pill appears, header shows "1 unsaved change". **Salesforce is unchanged at this point.** |
| Click **Deactivate All** | All rows turn amber if any were active |
| Click **Discard Changes** | All pending state cleared, switches return to original |
| Make changes → click **Deploy** | Spinner in button → green success banner → switch back to your Salesforce Setup tab → refresh the Account → Validation Rules page → see the changes are live |
| Click **Refresh** | Re-fetches from Salesforce, discards any pending |
| Click **Logout** | Returns to login page, session cleared |



- **Frontend:** `npm run build` produces a static bundle in `client/dist/`. Host on Render / Vercel / Netlify.
- **Backend:** deploy `server/` to Render / Railway. Set every variable from `server/.env.example` on the platform.
- **Same-origin or CORS?** Easiest path: serve the built frontend from the Express backend (no CORS, no separate domain). Otherwise set `CLIENT_ORIGIN` on the backend to the frontend's exact origin.
- **Session store:** swap the default in-memory store for `connect-redis` or `connect-sqlite3` before going live. The in-memory store loses sessions on every restart.
- **Connected app callback:** add the production callback URL to your External Client App alongside the localhost one.

## Implementation note: Tooling API quirk

`ValidationRule.Active` is not directly writable. To toggle a rule we:

1. `conn.tooling.sobject('ValidationRule').retrieve(id)` — fetches the full `Metadata` object
2. Mutate `rule.Metadata.active`
3. `conn.tooling.sobject('ValidationRule').update({ Id, Metadata: rule.Metadata })` — writes the full metadata back

Sending only `{ Metadata: { active: false } }` would wipe the formula and error message — the entire `Metadata` object must be round-tripped.

## Alternative deploy approach

The current `/api/validation-rules/deploy` endpoint re-asserts each rule's current state via the Tooling API. A more "Salesforce-canonical" approach would build a `package.xml` plus zipped `.validationRule-meta.xml` files and call `conn.metadata.deploy()`. The current approach was chosen for simplicity; the canonical approach is left as a future enhancement.
