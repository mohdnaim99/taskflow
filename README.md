# TaskFlow - Mini Task Manager

Angular 18 + ASP.NET Core 8 Web API + PostgreSQL, containerised with Docker and with Kubernetes manifests.

## Run with Docker Compose

If port 8080 or 4200 is already in use, change `BACKEND_PORT` / `FRONTEND_PORT` in `.env`.

Requirements: Docker Desktop (or Docker Engine + Compose v2).

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
docker compose up --build
```

The `.env` step is required: secrets are never committed, so compose stops with a clear
message if the file is missing. The defaults in `.env.example` work as-is for a local demo.

| Service  | URL                             |
|----------|---------------------------------|
| Frontend | http://localhost:4200           |
| API      | http://localhost:8080/api       |
| Swagger  | http://localhost:8080/swagger   |
| Health   | http://localhost:8080/health    |
| Postgres | internal only (`db:5432`)       |

Demo login: `admin@taskflow.com` / `Admin@123` (set by `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

The frontend's nginx proxies `/api` and `/swagger` to the backend, so the browser talks to a single origin and no CORS configuration is needed.

Stop with `docker compose down` (add `-v` to also delete the database volume).

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | db, backend | Database name and credentials (avoid `;` and `=` in the password) |
| `JWT_KEY` | backend (`Jwt__Key`) | HMAC signing key, minimum 32 characters |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | backend (`Auth__Email`, `Auth__Password`) | The single demo user |
| `FRONTEND_PORT`, `BACKEND_PORT` | compose | Host ports (defaults 4200 / 8080) |

Non-secret defaults (issuer, audience, token lifetime) live in `backend/TaskFlow.Api/appsettings.json`.
The backend refuses to start if the connection string, JWT key or admin credentials are missing.

## Migrations

Migrations live in `backend/TaskFlow.Api/Migrations/` and are applied automatically when the
backend starts (with retries while Postgres warms up). Disable with `Database__MigrateOnStartup=false`.

Manual run or creating a new migration (needs the .NET 8 SDK and `dotnet tool install -g dotnet-ef`):

```bash
cd backend/TaskFlow.Api
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=taskflow;Username=taskflow;Password=..."
dotnet ef database update                 # apply
dotnet ef migrations add <Name>           # create one after changing the models
```

In Visual Studio: Package Manager Console -> `Update-Database` / `Add-Migration <Name>`.

## Local development (without Docker)

```bash
# 1. PostgreSQL, e.g.
docker run -d --name taskflow-db -e POSTGRES_DB=taskflow -e POSTGRES_USER=taskflow \
  -e POSTGRES_PASSWORD=devpass123 -p 5432:5432 postgres:16-alpine

# 2. Backend secrets (stored outside the repo with .NET user-secrets)
cd backend/TaskFlow.Api
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=taskflow;Username=taskflow;Password=devpass123"
dotnet user-secrets set "Jwt:Key" "<at least 32 random characters>"
dotnet user-secrets set "Auth:Email" "admin@taskflow.com"
dotnet user-secrets set "Auth:Password" "Admin@123"
dotnet run                                # or F5 in Visual Studio

# 3. Frontend
cd frontend
npm install
npm start                                 # http://localhost:4200
```

The dev server forwards `/api` and `/swagger` using `frontend/proxy.conf.json`.
It targets `http://127.0.0.1:5045`, the port Visual Studio's `http` profile uses
(see `Properties/launchSettings.json`). Change the target if your API runs on another port.

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | - | `{email, password}` -> `{token, expiresAt}` |
| GET | `/api/tasks` | JWT | List tasks (newest first) |
| GET | `/api/tasks/{id}` | JWT | Get one task |
| POST | `/api/tasks` | JWT | Create (`title` required; `description`, `priority`, `dueDate` optional) |
| PUT | `/api/tasks/{id}` | JWT | Update title / description / priority / dueDate |
| PATCH | `/api/tasks/{id}/status` | JWT | `{status: "Todo" or "Done"}` |
| DELETE | `/api/tasks/{id}` | JWT | Delete (204) |
| GET | `/health` | - | Liveness / readiness |

Task fields: `title` (required, max 200), `description` (max 2000), `priority` (`Low`/`Medium`/`High`),
`dueDate` (`yyyy-MM-dd`), `status` (`Todo`/`Done`).

Every error uses the same shape:

```json
{ "status": 400, "message": "One or more fields are invalid.", "errors": { "Title": ["Title is required."] }, "traceId": "..." }
```

## Kubernetes

Manifests are in `k8s/`: ConfigMap, Secret, Deployment + Service for db / backend / frontend,
a PVC for Postgres, probes on `/health`, and an Ingress (bonus).

```bash
docker build -t taskflow-backend:latest ./backend
docker build -t taskflow-frontend:latest ./frontend
# kind:     kind load docker-image taskflow-backend:latest taskflow-frontend:latest
# minikube: minikube image load taskflow-backend:latest && minikube image load taskflow-frontend:latest

# Create the real secret (k8s/01-secret.yaml only holds placeholders)
kubectl create secret generic taskflow-secret \
  --from-literal=POSTGRES_PASSWORD='<password>' \
  --from-literal=Jwt__Key="$(openssl rand -base64 48)" \
  --from-literal=Auth__Password='<admin password>'

kubectl apply -f k8s/00-configmap.yaml -f k8s/10-database.yaml -f k8s/20-backend.yaml -f k8s/30-frontend.yaml
kubectl get pods -w
kubectl port-forward svc/frontend 8081:80      # http://localhost:8081
```

Optional Ingress (needs an ingress controller such as ingress-nginx): `kubectl apply -f k8s/40-ingress.yaml`.
Do not apply `01-secret.yaml` after creating the real secret, or the placeholders will overwrite it.

## Project layout
