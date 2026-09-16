# Project Camp Backend

A RESTful backend API for a collaborative **project management platform** built with **Node.js, Express.js, MongoDB, and Mongoose**.

The backend provides user authentication, JWT-based authorization, project management, project membership and role-based permissions. The data layer is also structured for tasks, subtasks, and project notes as the project continues to expand.

> **Current implementation:** Authentication and project/project-member management are implemented and exposed through API routes. Task, subtask, and note models are present in the data layer, while their API layer is part of the planned expansion.

---

## Features

### Authentication

- User registration
- Email verification
- User login
- JWT access tokens
- JWT refresh tokens
- Refresh-token rotation
- HTTP-only authentication cookies
- Bearer-token authentication through the `Authorization` header
- Current-user endpoint
- Logout
- Change password
- Forgot-password flow
- Password reset
- Resend email verification
- Password hashing with `bcrypt`
- Request validation with `express-validator`

### Project Management

- Create projects
- List projects accessible to the authenticated user
- Fetch project details
- Update project information
- Delete projects
- Automatically create a project membership for the project creator
- Project member listing
- Add project members
- Update project member roles
- Remove project members
- Project-level role-based authorization

### Project Roles

The project defines three roles:

| Role | Description |
| --- | --- |
| `admin` | System-level administrator |
| `project_admin` | Administrative access within a project |
| `member` | Basic project membership |

Project authorization is handled through reusable middleware that checks the authenticated user's membership and role before allowing protected operations.

### Data Models

The repository currently contains models for:

- User
- Project
- Project Member
- Task
- Subtask
- Project Note

The task model also supports:

- Task assignment
- Task status
- File attachment metadata

Supported task statuses:

```text
todo
in_progress
done
```

---

## Tech Stack

| Technology | Purpose |
| --- | --- |
| **Node.js** | JavaScript runtime |
| **Express 5** | REST API framework |
| **MongoDB** | Database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication and authorization |
| **bcrypt** | Password hashing |
| **express-validator** | Request validation |
| **Nodemailer** | Email delivery |
| **Mailgen** | Email template generation |
| **cookie-parser** | Cookie handling |
| **CORS** | Cross-origin request configuration |
| **dotenv** | Environment configuration |
| **Nodemon** | Development server |
| **Prettier** | Code formatting |

The dependencies and scripts are defined in `package.json`. citeturn1view1

---

## Architecture

The project follows a modular Express architecture:

```text
Client
   │
   ▼
Routes
   │
   ├── Validation Middleware
   │
   ├── JWT Authentication
   │
   └── Project Permission Middleware
           │
           ▼
       Controllers
           │
           ▼
      Mongoose Models
           │
           ▼
        MongoDB
```

### Request Flow

For a protected project request:

```text
HTTP Request
     │
     ▼
verifyJWT
     │
     ▼
Load authenticated user
     │
     ▼
validateProjectPermission
     │
     ▼
Check project membership + role
     │
     ▼
Controller
     │
     ▼
MongoDB
     │
     ▼
API Response
```

The authentication middleware accepts an access token from either the `accessToken` cookie or a Bearer token in the `Authorization` header. Project permissions are then checked against the user's `ProjectMember` record. citeturn4view1

---

## Project Structure

```text
project-management-backend/
│
├── public/
│   └── images/
│
├── src/
│   ├── controllers/
│   │   ├── auth.controllers.js
│   │   ├── healthcheck.controllers.js
│   │   └── project.controllers.js
│   │
│   ├── db/
│   │   └── index.js
│   │
│   ├── middlewares/
│   │   ├── auth.middlewares.js
│   │   └── validator.middlewares.js
│   │
│   ├── models/
│   │   ├── user.models.js
│   │   ├── project.models.js
│   │   ├── projectmember.models.js
│   │   ├── task.models.js
│   │   ├── subtask.models.js
│   │   └── note.models.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── healthcheck.routes.js
│   │   └── project.routes.js
│   │
│   ├── utils/
│   │   ├── api-error.js
│   │   ├── api-response.js
│   │   ├── async-handler.js
│   │   ├── constants.js
│   │   └── mail.js
│   │
│   ├── validators/
│   │   └── index.js
│   │
│   ├── app.js
│   └── index.js
│
├── PRD.md
├── package.json
├── package-lock.json
├── .prettierrc
├── .prettierignore
└── README.md
```

---

## API

Base URL:

```text
http://localhost:3000/api/v1
```

### Health Check

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/healthcheck/` | Public | Check API health |

### Authentication

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Authenticate a user |
| `GET` | `/auth/verify-email/:verificationToken` | Public | Verify user email |
| `POST` | `/auth/refresh-token` | Public | Refresh access token |
| `POST` | `/auth/forgot-password` | Public | Request password reset |
| `POST` | `/auth/reset-password/:resetToken` | Public | Reset password |
| `POST` | `/auth/logout` | Protected | Logout current user |
| `POST` | `/auth/current-user` | Protected | Get authenticated user |
| `POST` | `/auth/change-password` | Protected | Change current password |
| `POST` | `/auth/resend-email-verification` | Protected | Resend verification email |

These routes are wired through `auth.routes.js` and use validation middleware on applicable requests. citeturn5view3

### Projects

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/projects/` | Protected | List user's projects |
| `POST` | `/projects/` | Protected | Create a project |
| `GET` | `/projects/:projectId` | Protected + role | Get project details |
| `PUT` | `/projects/:projectId` | Protected + role | Update project |
| `DELETE` | `/projects/:projectId` | Protected + role | Delete project |
| `GET` | `/projects/:projectId/members` | Protected + role | List project members |
| `POST` | `/projects/:projectId/members` | Protected + role | Add a project member |
| `PUT` | `/projects/:projectId/members/:userId` | Protected + role | Update member role |
| `DELETE` | `/projects/:projectId/members/:userId` | Protected + role | Remove member |

All project routes first require JWT authentication. Project-specific endpoints additionally use the project permission middleware. citeturn2view3

---

## Authentication

The authentication system uses an access-token + refresh-token model.

### Login Flow

```text
Client
  │
  ▼
POST /auth/login
  │
  ▼
Validate credentials
  │
  ▼
Generate access token
  │
  ├───────────────┐
  ▼               ▼
Access Token   Refresh Token
  │               │
  └───────┬───────┘
          ▼
     HTTP-only cookies
```

The user model hashes passwords before saving and provides methods for generating access and refresh JWTs. Temporary tokens are generated for email verification and password-reset flows. citeturn4view2

### Access Token Sources

Protected endpoints can authenticate using:

```http
Authorization: Bearer <access_token>
```

or the `accessToken` HTTP-only cookie.

---

## Project Authorization

Project membership is stored separately from the project itself.

```text
User
 │
 │ 1:N
 ▼
ProjectMember
 │
 ├── user
 ├── project
 └── role
       │
       ├── admin
       ├── project_admin
       └── member
```

This allows the same user to have different roles across different projects.

The `ProjectMember` model stores the relationship between users and projects together with the user's project-level role. citeturn5view0

---

## Database Models

### User

The user model includes:

- `username`
- `email`
- `fullName`
- `avatar`
- `password`
- `isEmailVerified`
- `refreshToken`
- Email verification token fields
- Password reset token fields
- Timestamps

Passwords are automatically hashed with bcrypt before being persisted. citeturn4view2

### Project

A project contains:

```text
name
description
createdBy
createdAt
updatedAt
```

The creator is stored as a reference to the `User` model. citeturn4view3

### ProjectMember

A project membership contains:

```text
user
project
role
createdAt
updatedAt
```

citeturn5view0

### Task

The task schema is prepared for:

```text
title
description
project
assignedTo
assignedBy
status
attachments
createdAt
updatedAt
```

Attachments store metadata such as URL, MIME type, and file size. citeturn6view0

### Subtask

Subtasks are associated with a parent task and contain:

```text
title
description
task
isCompleted
createdBy
createdAt
updatedAt
```

citeturn6view1

### Project Note

Project notes contain:

```text
project
createdBy
content
createdAt
updatedAt
```

citeturn6view2

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js
- npm
- MongoDB
- A Mailtrap account or compatible SMTP server for development email delivery

### 1. Clone the repository

```bash
git clone https://github.com/Ayush16110/project-management-backend.git
cd project-management-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000

MONGO_URI=mongodb://127.0.0.1:27017/project-management

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

CORS_ORIGIN=http://localhost:5173

MAILTRAP_SMTP_HOST=your_smtp_host
MAILTRAP_SMTP_PORT=your_smtp_port
MAILTRAP_SMTP_USER=your_smtp_username
MAILTRAP_SMTP_PASS=your_smtp_password

FORGOT_PASSWORD_REDIRECT_URL=http://localhost:5173/reset-password
```

> Use strong, unique secrets for JWT signing keys and never commit your `.env` file.

The application loads environment variables through `dotenv` before connecting to MongoDB and starting the Express server. citeturn5view2

### 4. Start the development server

```bash
npm run dev
```

The development script uses Nodemon. citeturn1view1

### 5. Start the production server

```bash
npm start
```

The server connects to MongoDB before listening for requests. citeturn5view2

---

## CORS

The application supports credentialed CORS requests.

By default:

```text
http://localhost:5173
```

is used as the allowed origin when `CORS_ORIGIN` is not configured.

Multiple origins can be supplied as a comma-separated environment variable:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

The API allows:

```text
GET
POST
PUT
PATCH
DELETE
OPTIONS
```

and supports the `Authorization` header. citeturn4view0

---

## Development Scripts

### Development

```bash
npm run dev
```

Runs the application using Nodemon.

### Production

```bash
npm start
```

Starts the application with Node.js.

### Formatting

```bash
npm run prettier
```

Formats the project using Prettier.

---

## Error Handling

The project uses reusable utility classes and middleware for consistent API behavior:

```text
ApiError
ApiResponse
asyncHandler
validator middleware
```

Controllers use `asyncHandler` to forward asynchronous errors to the application's error-handling flow.

---

## Roadmap

The project is being developed incrementally.

### Completed

- [x] Express server setup
- [x] MongoDB/Mongoose integration
- [x] User model
- [x] JWT authentication
- [x] Access/refresh token flow
- [x] Email verification
- [x] Password reset
- [x] Password change
- [x] Authentication middleware
- [x] Request validation
- [x] Project model
- [x] Project creation
- [x] Project listing
- [x] Project details
- [x] Project update/delete
- [x] Project member model
- [x] Project member listing
- [x] Member role updates
- [x] Member removal
- [x] Project-level permission middleware
- [x] Task/subtask/note data models

### In Progress / Planned

- [ ] Complete task API
- [ ] Task assignment
- [ ] Task status management
- [ ] Subtask API
- [ ] Project notes API
- [ ] Task file uploads
- [ ] More granular authorization rules
- [ ] Automated tests
- [ ] API documentation / Swagger
- [ ] Production deployment

The broader product scope and intended endpoint design are documented in `PRD.md`. citeturn1view2

---

## Security Considerations

The backend currently implements several security-related mechanisms:

- Password hashing with bcrypt
- JWT-based authentication
- Refresh-token validation
- HTTP-only authentication cookies
- Protected routes
- Project-level role checks
- Input validation
- Email verification
- Expiring temporary verification/reset tokens
- CORS configuration
- Sensitive authentication fields excluded from normal user queries

Temporary email-verification and password-reset tokens are hashed before storage and configured with a short expiration period. citeturn2view0turn4view2

---

## Project Documentation

The repository also contains a Product Requirements Document:

```text
PRD.md
```

It describes the intended Project Camp Backend product, including authentication, projects, members, tasks, subtasks, notes, role-based access control, file attachments, and the planned API structure. citeturn1view2

---

## Author

**Ayush16110**

GitHub:  
https://github.com/Ayush16110

Repository:  
https://github.com/Ayush16110/project-management-backend

---

## License

This project is licensed under the **ISC License**.