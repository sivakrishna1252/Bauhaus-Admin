# Interior Design Client Portal - Backend

A production-ready Node.js backend for an interior design firm. This system allows admins to manage clients and projects, and clients to view their project progress through a secure portal.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (v24 recommended)
- **PostgreSQL**: A running database instance

### 2. Installation
```powershell
# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5004
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"
JWT_SECRET="your_very_secure_random_secret"
```

### 4. Database Setup & Seeding
```powershell
# Sync database schema
npx prisma migrate dev --name init

# Create the initial Admin account
npx tsx src/seed-admin.ts
```

### 5. Run the Server
```powershell
# Development mode
npm run dev
```

---

## 🛠 Features

### 🔐 Authentication
The system uses **JWT (JSON Web Tokens)** for secure access.
- **Admin**: Login with Email/Password.
- **Client**: Login with Username/4-digit PIN.

### 🍱 Accessing the Interfaces
- **Visual Admin Panel**: [http://72.60.219.145:5004/admin](http://72.60.219.145:5004/admin)
- **Interactive API Documentation (Swagger)**: [http://72.60.219.145:5004/api-docs](http://72.60.219.145:5004/api-docs)

### 📁 Technical Stack
- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript
- **ORM**: Prisma 7 (with Driver Adapters)
- **Database**: PostgreSQL
- **Documentation**: Swagger UI
- **Storage**: Local filesystem (for project uploads)

---

## 🏗 API Endpoints

### Auth
- `POST /api/auth/admin/login`: Admin entry.
- `POST /api/auth/client/login`: Client entry.

### Admin Tools (Admin Only)
- `GET /api/admin/clients`: List all clients.
- `POST /api/admin/clients`: Add a new client.
- `PATCH /api/admin/clients/:id/block`: Disable a client's access.

### Projects
- `POST /api/projects`: Create a project.
- `GET /api/projects`: Admin view of all projects.
- `GET /api/my-projects`: Client view of their own projects.

### Project Entries
- `POST /api/projects/:id/entries`: Upload a progress photo and description.
- `GET /api/projects/:id/entries`: View history of updates.

---

## 👨‍💻 Seed Credentials
**Admin Email:** `admin@interior.com`  
**Admin Password:** `admin123`
