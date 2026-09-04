# Developer Task Management API

A companion practice starter project designed for experienced React, Angular, and JavaScript/TypeScript frontend developers transitioning into full-stack development.

This project is part of the **"Frontend Developer to Full-Stack Developer Roadmap (2026 Edition)"**.

> **Note**: This repository is designed specifically as a practice starter application to build backend conceptual understanding and enable client-side integration. It is not intended to be an enterprise production template.

---

## What You Will Practice

* Architectural layering in server-side TypeScript applications.
* Mapping REST APIs to SQL databases via Object-Relational Mapping (ORM).
* JWT authentication lifecycle (issuance, headers, guard validation).
* Input validation and transformation using Data Transfer Objects (DTOs).
* Connecting SPA clients (React, Angular, Vue) to a self-hosted API.

---

## Architectural Overview

This API uses NestJS modular architecture. The application standardizes data flow as follows:

```
[ Frontend Client ]
        │
    (HTTP Request)
        ▼
   [ Controller ]   ◄── Handles routing, extracts HTTP body/headers
        │
   [ DTO Guard ]    ◄── Validates request body structure and types
        │
    [ Service ]     ◄── Executes business logic and data manipulation
        │
   [ Repository ]   ◄── Manages persistence and database operations
        │
   [ PostgreSQL ]
```

### Key Framework Concepts for Frontend Developers

* **Controller**: Analogue to UI page routes or client component handlers. Listens for incoming HTTP requests, extracts params, and delegates processing.
* **Service**: Pure business logic modules. Performs computations, orchestrates data updates, and interacts with the database.
* **Dependency Injection (DI)**: Design pattern where the framework instantiates and supplies required instances (e.g., injecting `TasksService` into `TasksController`) rather than manually constructing classes with `new`.
* **DTO (Data Transfer Object)**: Schema definitions typed via TypeScript classes and runtime validation decorators (`class-validator`) that govern the shape of payload data entering the server.
* **JWT (JSON Web Token)**: Cryptographically signed token containing user identifiers sent in the HTTP `Authorization` header (`Bearer <token>`).
* **Authentication vs. Authorization**: Authentication verifies *who* the user is; Authorization determines *what* resources they are allowed to access.
* **Repository Access**: Interface layer (TypeORM) that abstracts SQL raw queries (`SELECT`, `INSERT`) into type-safe JavaScript methods (`find()`, `save()`).

---

## Directory Structure

```
src/
├── app.module.ts              # Root application module configuration
├── main.ts                    # Entry point; sets prefix, validation, & listens on port
├── auth/                      # Authentication logic, JWT generation, login/register
│   ├── dto/                   # Auth input shapes
│   ├── strategies/            # Passport JWT validation strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                     # User management module
│   ├── entities/              # Database table schema definition for User
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── tasks/                     # Task management business logic
│   ├── dto/                   # Task inputs (CreateTaskDto, UpdateTaskDto)
│   ├── entities/              # Database table schema definition for Task
│   ├── enums/                 # Task status and priority enums
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── database/                  # Connection setup and TypeORM config
└── common/                    # Cross-cutting decorators & JWT guards
```

---

## Setup & Local Execution

### Prerequisites
* Node.js (v18 or v20 recommended)
* Docker Desktop (optional, for rapid database setup)
* PostgreSQL (if running outside Docker)

### 1. Environment Configuration
Copy the default environment configuration:
```bash
cp .env.example .env
```

### 2. Run Database via Docker Compose
To start a localized PostgreSQL container without installing database software manually:
```bash
docker-compose up postgres -d
```

### 3. Install Dependencies & Run Application
```bash
# Install node packages
npm install

# Start server in watch mode
npm run start:dev
```
The API server will listen at `http://localhost:3000/api/v1`.

### 4. Running the Entire Application in Docker
To build and run both the Node.js API server and PostgreSQL container together:
```bash
docker-compose up --build
```

---

## Testing

Execute the end-to-end integration test suite:
```bash
npm run test:e2e
```

---

## API Endpoints

All routes are prefixed with `/api/v1`. Protected routes require an `Authorization` header set to `Bearer <YOUR_JWT_TOKEN>`.

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | No | Creates user account & returns token |
| `POST` | `/auth/login` | No | Authenticates credentials & returns token |
| `GET` | `/users/me` | **Yes** | Returns authenticated user profile |
| `GET` | `/tasks` | **Yes** | Lists all tasks owned by user |
| `POST` | `/tasks` | **Yes** | Creates a new task |
| `GET` | `/tasks/:id` | **Yes** | Retrieves single task by ID |
| `PATCH` | `/tasks/:id` | **Yes** | Updates task properties |
| `DELETE` | `/tasks/:id` | **Yes** | Deletes a task |
| `PATCH` | `/tasks/:id/complete` | **Yes** | Shortcut to set task status to `COMPLETED` |

---

## Example cURL Requests

### Register Account
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "password123",
    "name": "Alex Developer"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "password123"
  }'
```

### Create Task (Protected)
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "title": "Integrate React Frontend",
    "description": "Connect Axios instance to NestJS API",
    "priority": "HIGH"
  }'
```

---

## Frontend Integration Guide (React / Angular)

### React Integration Pattern (using `fetch` or `axios`)

```typescript
// Example HTTP Service module
const API_URL = 'http://localhost:3000/api/v1';

export async function fetchUserTasks(token: string) {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  
  return response.json();
}
```

### Angular Integration Pattern (using `HttpClient` and Interceptor)

```typescript
// auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}
```

---

## Common Issues & Troubleshooting

* **`QueryFailedError: relation "tasks" does not exist`**: Database isn't initialized yet. Ensure `synchronize: true` is active in `src/database/database.module.ts` during local development to auto-create schema tables.
* **`401 Unauthorized`**: Ensure you are appending the exact prefix `Bearer ` prior to pasting your JWT token in headers.
* **`400 Bad Request`**: Check response payload details. `class-validator` will explicitly list failed properties (e.g., malformed email or missing required fields).
* **`ECONNREFUSED 127.0.0.1:5432`**: The API cannot reach PostgreSQL. Ensure your Docker container is actively running using `docker ps`.

---

# Practice Challenges

Extend the API by implementing these practice challenges.

### Challenge 1: Return Only Completed Tasks
* **Task**: Create an endpoint GET `/api/v1/tasks/completed` that returns tasks with status `COMPLETED`.
* **Files to change**: `tasks.controller.ts`, `tasks.service.ts`.
* **Concept Practiced**: Custom repository query filters, route declaration sequence in NestJS controllers.

### Challenge 2: Add Filtering by Task Status
* **Task**: Modify GET `/api/v1/tasks` to accept optional query parameters (e.g., `/api/v1/tasks?status=IN_PROGRESS`).
* **Files to change**: `tasks.controller.ts`, `tasks.service.ts`, create a `GetTasksFilterDto`.
* **Concept Practiced**: Handling query parameters using `@Query()` decorator, dynamic TypeORM query filtering.

### Challenge 3: Add Pagination
* **Task**: Support `limit` and `offset` query parameters on the list tasks endpoint.
* **Files to change**: `tasks.controller.ts`, `tasks.service.ts`.
* **Concept Practiced**: SQL `LIMIT` and `OFFSET` implementation, paginated response construction.

### Challenge 4: Add Sorting by Creation Date
* **Task**: Allow users to pass a `sort` query parameter to list tasks (`ASC` or `DESC`).
* **Files to change**: `tasks.controller.ts`, `tasks.service.ts`.
* **Concept Practiced**: Programmatic SQL ordering logic.

### Challenge 5: Add a New Task Field
* **Task**: Add a `dueDate` field (Date type, optional) to the task entity and all related APIs.
* **Files to change**: `task.entity.ts`, `create-task.dto.ts`, `update-task.dto.ts`.
* **Concept Practiced**: End-to-end entity expansion across database models, DTO validations, and controller mappings.

### Challenge 6: Task Comments Module
* **Task**: Build a child resource module allowing users to attach textual comments to specific tasks (`/tasks/:id/comments`).
* **Files to change**: New `CommentsModule`, `Comment` entity with relational `@ManyToOne` bindings to `Task` and `User`.
* **Concept Practiced**: Module creation via NestJS CLI, database relational keys (`FOREIGN KEY`), relational cascades.

### Challenge 7: Connect to Client Frontend
* **Task**: Create a UI in React, Angular, or Vue with a form to authenticate, retrieve, and toggle complete state on tasks using this backend API.
* **Files to change**: Client-side code in an external repository or project folder.
* **Concept Practiced**: End-to-end full-stack state authorization handling, CORS configuration, handling HTTP status responses client-side.

### Challenge 8: Add Another Protected Endpoint
* **Task**: Build a `PATCH /users/me` endpoint to let logged-in users update their `name`.
* **Files to change**: `users.controller.ts`, `users.service.ts`, create an `UpdateProfileDto`.
* **Concept Practiced**: Auth context consumption, entity updates without exposing sensitive attributes.
