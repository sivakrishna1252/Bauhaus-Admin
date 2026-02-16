# 📔 Interior Design API Mastery Guide

This guide is your complete map for the backend. It explains exactly how to talk to the server, what it needs, and what it gives back.

---

## 🔐 1. Authentication (Admins & Clients)

### � Admin Login
- **Use:** To get the secret `token` needed for all Admin features.
- **Endpoint:** `POST /api/auth/admin/login`
- **Body:** `{ "email": "admin@interior.com", "password": "admin" }`
- **Response:** `{ "token": "JWT...", "role": "ADMIN" }`

### 🆘 Forgot Password (Request)
- **Use:** When the Admin is locked out.
- **Endpoint:** `POST /api/auth/request-reset`
- **Body:** `{ "email": "registered_admin@gmail.com" }`
- **Response:** `{ "message": "Instructions sent..." }`
- **Behind the scenes:** Check server logs for the actual link during testing.

### � Reset Password (Finish)
- **Use:** To set a brand new password using the secret token.
- **Endpoint:** `POST /api/auth/reset-password`
- **Body:** `{ "token": "token_from_link", "newPassword": "newSecret99" }`
- **Response:** `{ "message": "Password updated successfully" }`

---

## ️ 2. Admin Account Management (Admin Only)
*Headers required: `Authorization: Bearer <ADMIN_TOKEN>`*

### 👤 Update My Profile
- **Use:** To change your own Admin Email or your login Password.
- **Endpoint:** `PATCH /api/admin/profile`
- **Body:** `{ "email": "new_boss@gmail.com", "newPassword": "optionalNewPassword" }`
- **Response:** `{ "message": "Profile updated", "email": "new_boss@gmail.com" }`

---

## 👥 3. Managing Clients (Admin Only)
*Headers required: `Authorization: Bearer <ADMIN_TOKEN>`*

### ➕ Add New Client
- **Use:** To register a new customer and give them a starting PIN.
- **Endpoint:** `POST /api/admin/clients`
- **Body:** `{ "username": "JohnDoe", "pin": "1234" }`
- **Response:** `{ "id": "client-uuid", "username": "JohnDoe" }`
- **Validation Errors (400):** 
    - `{ "message": "Name already taken" }` - If username already exists.
    - `{ "message": "PIN already taken" }` - If the 4-digit PIN is already assigned to another client.

### 🔑 Emergency PIN Reset
- **Use:** If a client forgets their 4-digit PIN, Admin resets it for them.
- **Endpoint:** `PATCH /api/admin/clients/:id/reset-pin`
- **Body:** `{ "newPin": "0000" }`
- **Response:** `{ "message": "Client PIN updated" }`
- **Validation Errors (400):**
    - `{ "message": "PIN already taken" }` - If the new PIN is already assigned to another client.

### � Block/Unblock Client
- **Use:** To stop a client from logging in (e.g., payment pending).
- **Endpoint:** `PATCH /api/admin/clients/:id/block` (or `/unblock`)
- **Body:** (None)
- **Response:** `{ "message": "Client blocked successfully" }`

### 🗑️ Delete Client Account
- **Use:** To permanently remove a client and all their projects/images from the system.
- **Endpoint:** `DELETE /api/admin/clients/:id`
- **Response:** `{ "message": "Client and all associated projects/files deleted successfully" }`
- **Warning:** This will also delete physical files from the `uploads` folder!

---

## 🏗️ 4. Creating Projects (Admin Only)
*Headers required: `Authorization: Bearer <ADMIN_TOKEN>`*

### ➕ Create a Project
- **Use:** To start a renovation record for a specific client.
- **Endpoint:** `POST /api/projects`
- **Body:** `{ "clientId": "id", "title": "Master Bedroom", "description": "Lamination & Lighting" }`
- **Response:** Full project object including state `PENDING`.

---

## 🎞️ 5. Project Updates - Media Uploads (Admin Only)
*This is the most powerful API. It uses **MULTIPART FORM-DATA**.*
*Headers required: `Authorization: Bearer <ADMIN_TOKEN>`*

### 📤 Upload Photos, Videos or PDFs (Bulk Upload)
- **Use:** To post multiple progress updates (images, MP4 videos, or PDFs) to a project at once.
- **Endpoint:** `POST /api/projects/:id/entries`
- **Max Files:** 20 files per request.
- **Form Data:**
    - `media`: [The Files (JPG/PNG, MP4/MOV, or PDF)] - *Attach multiple files to this field.*
    - `description`: "Latest site progress" (Apply to all files)
- **Response:** An array of created entries.
```json
[
  {
    "id": "entry-1-uuid",
    "fileUrl": "uploads/projects/pic.jpg",
    "fileType": "IMAGE",
    "description": "Latest site progress"
  },
  {
    "id": "entry-2-uuid",
    "fileUrl": "uploads/projects/doc.pdf",
    "fileType": "PDF",
    "description": "Latest site progress"
  }
]
```

---

## 🏠 6. Client Portal (Customer Side)

### 🔑 Client Login
- **Use:** For the customer to see their specific home updates.
- **Endpoint:** `POST /api/auth/client/login`
- **Body:** `{ "username": "JohnDoe", "pin": "0000" }`
- **Response:** `{ "token": "CLIENT_JWT...", "role": "CLIENT" }`

### 📋 View My Feed
- **Use:** Shows all projects and photos/videos assigned to THIS client.
- **Endpoint:** `GET /api/my-projects`
- **Response:** List of projects with a nested array of `entries` (Images/Videos).

---

## ⚠️ Important Rules for Integration:
1.  **Authorization Header:** Always send tokens like this: `Authorization: Bearer YOUR_TOKEN_HERE`.
2.  **File Paths:** When the server returns a `fileUrl` (like `uploads/photo.jpg`), you should display it in the frontend as `http://72.60.219.145:5004/uploads/photo.jpg`.
3.  **Video Player:** If `fileType` is `VIDEO`, use an `<video>` tag in HTML. If `IMAGE`, use `<img>`.
