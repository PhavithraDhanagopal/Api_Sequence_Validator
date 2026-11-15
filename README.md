# API Workflow Sequence Validator

A MERN application for creating API workflows, executing their steps sequentially, validating responses and reviewing execution history.

## Technology
- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- HTTP client: Axios

## Project structure

```text
api-workflow-validator-complete/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── .env.example
└── .gitignore
```

## Requirements
- Node.js 20 or later
- npm
- Existing MongoDB Atlas cluster and database user

## Setup

1. Extract this ZIP into a new folder, for example `D:\api-workflow-validator-complete`.
2. In `backend`, copy `.env.example` to `.env`.
3. Open `backend/.env` and set `MONGO_URI` to your existing MongoDB Atlas connection string. Keep `PORT=5000` and `CLIENT_URL=http://localhost:5173`.
4. Open a terminal in `backend` and run:

```powershell
npm install
npm run dev
```

5. Open a second terminal in `frontend` and run:

```powershell
npm install
npm run dev
```

6. Open the Vite URL shown in the frontend terminal (normally `http://localhost:5173`).

The backend uses the existing database name `api_workflow_validator`. Do not paste your connection string into source files or commit `.env`.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows` | List workflows |
| GET | `/api/workflows/:id` | Get workflow |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/executions/workflow/:id/run` | Execute workflow sequentially |
| POST | `/api/executions/workflow/:id/validate-trace` | Validate supplied step sequence |
| GET | `/api/executions` | List latest 50 executions |
| GET | `/api/executions/:id` | Get execution report |

## Step configuration
- `name`, `url`, `method`, `order`
- `headers` and `body` are JSON objects
- `expectedStatusCode` defaults to 200
- `requiredResponseFields` accepts dot paths, e.g. `profile.email`
- `expectedResponseValues` is a JSON object, e.g. `{ "id": 1 }`

### Passing data between steps
A later step's header or body can refer to an earlier response using:

```text
{{steps.Step Name.response.accessToken}}
```

Use the exact earlier step name and the response property path.

## Safety and limitations
- Execution accepts HTTP/HTTPS only, rejects local/private/reserved network targets, blocks IPv6 targets in this demo, disables redirects, and applies a 10-second timeout and 1 MB response/body limit.
- Use only APIs you own or are authorized to test. This is a college-project MVP, not a hardened public multi-tenant service. Before public deployment, add authentication, rate limiting, stronger egress controls and security testing.
- The trace validator compares step names and order; it does not infer an unknown trace format automatically.
- A workflow stops at the first failed step. The report stores the steps reached and their validation details.
- Request/response secrets should not be placed in test data. Review what response data is stored in execution history.

## Troubleshooting
- If Atlas does not connect, verify the URI in `backend/.env`, Atlas Network Access allowlist, database user credentials, and network connectivity. The current network's public IP must be allowed in Atlas.
- If the frontend cannot connect, confirm the backend is running on port 5000 and the frontend uses `http://localhost:5000/api`.
- If a request is blocked, check the URL safety rules above.
