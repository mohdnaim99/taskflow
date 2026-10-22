# Design decisions

## Backend
- **Layering:** `Controller -> Service -> Repository`. Controllers only translate HTTP; services hold rules and mapping; repositories are the only code that touches `DbContext`. Services depend on interfaces, so they can be unit-tested with a fake repository.
- **DTOs, not entities:** requests and responses are separate from `TaskItem`, so the API contract cannot leak or be mass-assigned from the database model.
- **Validation:** built-in DataAnnotations with `[ApiController]` auto-400. Chosen over FluentValidation to avoid an extra dependency for a handful of simple rules. A custom `InvalidModelStateResponseFactory` keeps validation errors in the same JSON shape as every other error.
- **One error shape:** `ExceptionHandlingMiddleware` (registered first in the pipeline) maps domain exceptions (`NotFoundException`, `UnauthorizedException`) to 404/401 and anything else to a generic 500. Details go to the logs only, never to the client. Every error carries a `traceId` so a user can quote it to support and we can find the matching log line. JWT challenge failures use the same JSON.
- **Auth:** HS256 JWT validated for issuer, audience, lifetime and signature. The single demo user is read from configuration, not code. The password is compared in constant time and the error message is identical for a wrong email or a wrong password.
- **Enums stored as strings** (`Todo`, `High`, ...): rows stay readable and reordering an enum cannot silently corrupt data. `DueDate` is a `date` (`DateOnly`) because a due date has no time zone. Timestamps are UTC.
- **Migrations:** committed in the repository and applied on startup with retries, so `docker compose up` needs no manual step. Trade-off: with several replicas, migrations should run as a separate job or init step instead (the `Database:MigrateOnStartup` flag allows that).
- **Configuration:** everything sensitive comes from environment variables (user-secrets in development). The app fails fast on startup if anything is missing.
- **Swagger** is enabled in all environments (the brief requires it) with a Bearer authorize button.

## Frontend
- **Structure:** standalone components with lazy-loaded routes. `core/` holds cross-cutting code (auth service, functional guard, interceptor, error-message mapper). The tasks feature is split into a data service (`TaskService`), a container (`TasksComponent`) and a presentational form (`TaskFormComponent`).
- **State:** Angular signals in the container. The list is patched locally after each successful call instead of refetching.
- **Auth:** token in `localStorage` (allowed by the brief). The interceptor attaches it only to `/api/*` calls (not login) and signs the user out on a 401. The guard also rejects expired tokens.
- **Same-origin API:** the SPA calls relative `/api/...` URLs. nginx (Docker/Kubernetes) or the dev-server proxy forwards them to the backend, so there is no CORS configuration and no API host baked into the bundle.
- **Loading and errors:** every request has a loading or busy state, and failures are translated into plain-language messages (network down, validation, not found, server error).
- The brief's section 5 (Frontend Engineering) repeats the backend list word for word. I treated it as a copy-paste error and applied the same intent to the frontend: clear separation, validation, and central error handling.

## Docker / Kubernetes
- Multi-stage builds (.NET SDK -> ASP.NET runtime; Node -> nginx). The backend runs as a non-root user. Dependency layers are cached by copying the project file / lockfile first.
- Compose reads secrets from `.env` (git-ignored); `${VAR:?}` makes a missing value fail loudly instead of starting with weak defaults. The database has a healthcheck and the backend waits for it. The compose volume is named `db_data`.
- Kubernetes: ConfigMap for non-secret values; Secret for DB password, JWT key and admin password (the committed file holds placeholders only, the real one is created with `kubectl`). Probes on `/health`, a PVC for Postgres with the `Recreate` strategy (single-writer volume), and an Ingress routing `/api` and `/swagger` to the backend and `/` to the frontend.
- Services use the same names (`db`, `backend`) in compose and Kubernetes, so `nginx.conf` and the connection string work unchanged in both.

## Known limitations / next steps
- `localStorage` tokens are exposed to XSS; production would use httpOnly cookies and refresh tokens.
- One hardcoded user and tasks are not per-user; a real version would add a Users table with hashed passwords and an owner column on tasks.
- No automated tests yet. Next: service unit tests, API integration tests with Testcontainers, Angular component tests.
- No pagination or filtering for large task lists.
- Backend runs a single replica; scaling out would move migrations to a Kubernetes Job.
