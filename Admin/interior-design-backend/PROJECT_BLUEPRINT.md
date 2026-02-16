# 🏗️ Interior Design Project Blueprint (Full Documentation)

This document is the official blueprint for the **Interior Design Project Management System**. It is designed to help frontend developers understand the backend architecture, data flow, and API integration requirements.

---

## 🌟 1. Project Vision
The goal of this system is to bridge the gap between interior designers (Admins) and their customers (Clients). 
- **Admins** manage the entire catalog of project updates, adding photos/videos to track progress.
- **Clients** have a personalized portal (accessible via a simple PIN) where they can see the visual journey of their home's transformation.

---

## 🛠️ 2. Core Modules & How They Work

### 🔐 A. Authentication System
There are **two distinct login flows**:
1.  **Admin Login**: Uses `email` and `password`. Returns a JWT token with `role: ADMIN`. This token is required for all management tasks (adding clients, creating projects, uploading files).
2.  **Client Login**: Uses `username` and a **4-digit PIN**. Returns a JWT token with `role: CLIENT`. This token allows the client to view ONLY their own projects.

### 👥 B. Client Management
Admins can:
- Register new clients.
- Block/Unblock clients (e.g., if a project is on hold).
- Reset client PINs (emergency access).

### 🏗️ C. Project & Feed Management
- **Hierarchy & IDs**: `Client (id)` -> `Project (clientId)` -> `ProjectEntry (projectId)`.
- **The Link**: When creating a project, the Admin must provide the `clientId`. This creates a permanent digital link.
- **The Feed**: Each Project has a **Feed** made of **ProjectEntries**. These entries are linked via `projectId`. One entry contains a description and **one file** (Image or Video).

---

## 🔒 2a. Data Privacy & Security (Strict Rules)
The system is built with a **"Zero-Leak"** privacy policy:
1.  **Client Insulation**: `Client A` can **NEVER** see `Client B`'s projects. 
2.  **Token-Based Filtering**: The server doesn't ask the client "which projects do you want?". Instead, it reads the `clientId` directly from the secure JWT token and only returns projects belonging to that specific ID.
3.  **No Guesstimation**: Even if a client knows another project's UUID, the backend will block access if that project doesn't belong to them.

---

## 📊 3. Data Architecture (Database Model)

The backend uses **PostgreSQL with Prisma**. Here is the data structure:

| Model | Key Fields | Purpose |
| :--- | :--- | :--- |
| **Admin** | `email`, `passwordHash` | System administrators. |
| **Client** | `username`, `pinHash`, `isBlocked` | Customers receiving services. |
| **Project** | `title`, `description`, `status` | A specific renovation task for a client. |
| **ProjectEntry** | `fileUrl`, `fileType`, `description` | Individual photo/video updates in a project. |

**Project Statuses**: `PENDING`, `IN_PROGRESS`, `DELAYED`, `COMPLETED`.
**File Types**: `IMAGE`, `VIDEO`.

---

## 📡 4. How to Integrate (Frontend Guide)

### 🔑 1. Handling the Token
Every request to a protected route (Admin or Client) must include the JWT token in the header:
```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### 📤 2. Uploading Media (Critical)
When the Admin adds an update (Photo/Video), the frontend MUST use `multipart/form-data`.
- **Target Endpoint**: `POST /api/projects/:id/entries`
- **Field Name**: `image` (The backend uses Multer to process this field).

### 🖼️ 3. Displaying Images & Videos
The API returns a `fileUrl` like `uploads/projects/123.jpg`.
- **Base URL**: You should append the backend URL to this path.
- **Example**: If the backend is on `http://72.60.219.145:5004`, the image source is `http://72.60.219.145:5004/uploads/projects/123.jpg`.

---

## 🚀 5. API Reference Table

### Auth & Settings
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/admin/login` | `POST` | Public | Admin login (Email/Pass) |
| `/api/auth/client/login` | `POST` | Public | Client login (User/PIN) |
| `/api/auth/request-reset` | `POST` | Public | Forgot Password (email) |
| `/api/admin/profile` | `PATCH`| Admin  | Update Admin email/password |

### Client Management (Admin Only)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/clients` | `GET` / `POST` | List all / Create new client |
| `/api/admin/clients/:id/reset-pin` | `PATCH` | Change client's 4-digit PIN |
| `/api/admin/clients/:id/block` | `PATCH` | Disable client access |

### Project Management
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/projects` | `POST` | Admin | Create project for a client |
| `/api/projects/:id` | `GET` | Admin | Get project details |
| `/api/projects/:id/entries`| `POST` | Admin | **Upload photo/video update** |
| `/api/my-projects` | `GET` | Client | **Client view: See all my projects** |

---

## 💡 6. Frontend Developer Checklist
- [ ] **State Management**: Use React Context or Redux to store the user `role` and `token`.
- [ ] **Axios Interceptor**: Automatically add the `Authorization` header to every request.
- [ ] **Video Preview**: When `fileType === 'VIDEO'`, use the `<video>` tag with `controls`.
- [ ] **Image Optimization**: Use CSS `object-fit: cover` for the project feed to keep it looking premium.
- [ ] **Error Handling**: Catch `401 Unauthorized` errors and redirect users to the login page.

---

## 🛠️ 7. Development Quick-Start

1. **Install Dependencies**: `npm install`
2. **Setup Env**: Create `.env` with `DATABASE_URL` and `JWT_SECRET`.
3. **Run Dev Server**: `npm run dev`
4. **Interactive Docs**: Visit `http://72.60.219.145:5004/api-docs` for a live playground.
