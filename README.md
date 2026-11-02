# Mini CRM

A role-based CRM for managing leads, companies and tasks, built with the MERN stack.

**Live app:** `[<NETLIFY_URL>](https://jade-froyo-27c632.netlify.app)`
**API:** `[<RENDER_URL>/api](https://mini-crm-fxw0.onrender.com/api)` (health check: `<RENDER_URL>/api/health`)

## Stack
- **Client:** React (Vite), React Router, MUI, TanStack Query, Axios
- **Server:** Node, Express, Mongoose, JWT, bcrypt
- **Database:** MongoDB Atlas
- **Hosting:** Netlify (client), Render (server)

## Folder Structure
```
/
├── client/              # Vite React app
│   ├── public/_redirects
│   └── src/
├── server/              # Express API
│   ├── models/          # User, Company, Lead, Task
│   ├── middleware/      # authMiddleware, roleMiddleware
│   ├── routes/
│   └── seed.js
└── README.md
```

## Local Setup
```bash
git clone https://github.com/0Sanjay0/mini-crm && cd mini-crm

# server
cd server && npm install
cp .env.example .env        # fill values
npm run seed
npm run dev                 # http://localhost:5000

# client (new terminal)
cd client && npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

## Environment Variables
**server/.env**
| Variable | Description |
|---|---|
| PORT | Server port (e.g. 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Long random secret for signing tokens |
| JWT_EXPIRES_IN | Token lifetime (e.g. 1d) |
| CLIENT_URL | Allowed frontend origin for CORS (no trailing slash) |

**client/.env**
| Variable | Description |
|---|---|
| VITE_API_URL | API base, e.g. http://localhost:5000/api |

## Seed & Test Credentials
`cd server && npm run seed` creates the users below, plus sample companies, leads and tasks.

| Role | Email | Password |
|---|---|---|
| Admin | admin@crm.com | Admin@123 |
| User | john@crm.com | User@123 |
| User | priya@crm.com | User@123 |

## API Endpoints (base `/api`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /health | Public | Health check |
| POST | /auth/login | Public | Login, returns JWT + user |
| GET | /auth/me | Auth | Current user |
| GET/POST | /users | Admin | List / create users |
| GET | /leads | Auth | List leads (paginated, search, status filter, role-scoped) |
| POST | /leads | Auth | Create lead |
| GET/PUT | /leads/:id | Auth | Get / update lead (role-scoped) |
| DELETE | /leads/:id | Auth | Soft delete lead |
| GET/POST | /companies | Auth | List / create companies |
| GET | /companies/:id | Auth | Company detail with associated leads |
| GET/POST | /tasks | Auth | List / create tasks |
| PATCH | /tasks/:id/status | Assignee only | Update task status |
| GET | /dashboard/stats | Auth | Dashboard counts (role-scoped) |

*(Adjust the access column to match your final routes.)*

## Authorization Logic

### JWT flow
1. `POST /auth/login` checks the email, then compares the password with `bcrypt.compare` against the stored hash.
2. On success the server signs a JWT containing the user id and role, using `JWT_SECRET` and `JWT_EXPIRES_IN`.
3. The client stores the token and the Axios interceptor sends `Authorization: Bearer <token>` on every request.
4. On page refresh the client calls `GET /auth/me` to restore the session.
5. On any 401 (expired, invalid or removed token) the client clears the token and redirects to `/login`.

### authMiddleware
Reads the Bearer token, verifies it, loads the user from the database and attaches it as `req.user`. A missing or invalid token returns **401**. It runs on every protected route.

### roleMiddleware
`roleMiddleware('admin')` runs after `authMiddleware` and checks `req.user.role`. If the role is not allowed it returns **403**. It is used on admin-only routes such as `/users`.

### Lead visibility
- **Admin:** sees all leads.
- **Normal user:** sees only leads assigned to them.
- The filter is applied on the server in the query (`{ assignedTo: req.user._id }` for users), so it also covers list, detail, company-detail leads and dashboard aggregations. It is not only a UI filter.

### Task status rule
Only the **assigned user** can change a task's status. Anyone else, **including admin**, gets **403**. The server compares `task.assignedTo` with `req.user._id`. There is no admin exception. The UI disables the status control for non-assignees, but the server is the source of enforcement.

## Soft Delete
Leads are never removed from the database. Deleting sets `isDeleted: true`. Mongoose query hooks and the aggregation pipelines exclude `isDeleted: true`, so deleted leads disappear from lists, company detail, dashboard counts and task lead lookups, while the document remains in MongoDB for audit and recovery.

## Deployment
- **Database:** MongoDB Atlas (network access allows Render).
- **Backend:** Render Web Service, root directory `server`, build `npm install`, start `npm start`.
- **Frontend:** Netlify, base directory `client`, build `npm run build`, publish `dist`.
- `client/public/_redirects` contains `/* /index.html 200` so React Router routes work on refresh.
- `CLIENT_URL` on Render must exactly match the Netlify URL.
- The Render free tier sleeps when idle, so the first request can take 30-60 seconds.
