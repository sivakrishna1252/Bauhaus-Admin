# 🚀 Frontend Integration Guide - Interior Design API

> **Complete reference for integrating the Interior Design Backend API with your frontend application**

---

## 📋 Table of Contents
1. [Quick Start](#-quick-start)
2. [Base Configuration](#-base-configuration)
3. [Authentication Flow](#-authentication-flow)
4. [Admin Operations](#-admin-operations)
5. [Client Portal](#-client-portal)
6. [Project Management](#-project-management)
7. [Media Upload & Display](#-media-upload--display)
8. [Error Handling](#-error-handling)
9. [Code Examples](#-code-examples)

---

## 🎯 Quick Start

### Prerequisites
- Backend server running on `http://72.60.219.145:5004`
- Node.js environment for frontend
- Basic understanding of REST APIs and JWT authentication

### Environment Setup
Create a `.env` file in your frontend project:

```env
VITE_API_BASE_URL=http://72.60.219.145:5004/api
VITE_MEDIA_BASE_URL=http://72.60.219.145:5004
```

---

## ⚙️ Base Configuration

### API Client Setup

```javascript
// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://72.60.219.145:5004/api';
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'http://72.60.219.145:5004';

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper for multipart/form-data (file uploads)
export const getAuthHeadersMultipart = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type for multipart - browser will set it with boundary
  };
};

export { API_BASE_URL, MEDIA_BASE_URL };
```

---

## 🔐 Authentication Flow

### 1. Admin Login

**Endpoint:** `POST /api/auth/admin/login`

**Request:**
```javascript
// src/services/authService.js
export const adminLogin = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  // Store token and role
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('userRole', data.role);
  
  return data;
};
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN"
}
```

**Usage Example:**
```javascript
try {
  const result = await adminLogin('admin@interior.com', 'admin123');
  console.log('Logged in as:', result.role);
  // Redirect to admin dashboard
} catch (error) {
  console.error('Login error:', error.message);
  // Show error to user
}
```

---

### 2. Client Login

**Endpoint:** `POST /api/auth/client/login`

**Request:**
```javascript
export const clientLogin = async (username, pin) => {
  const response = await fetch(`${API_BASE_URL}/auth/client/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, pin })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('userRole', data.role);
  
  return data;
};
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "CLIENT"
}
```

---

### 3. Forgot Password Flow

#### Step 1: Request Password Reset

**Endpoint:** `POST /api/auth/request-reset`

**Request:**
```javascript
export const requestPasswordReset = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/request-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  return data;
};
```

**Response:**
```json
{
  "message": "If an account exists with this email, password reset instructions have been sent."
}
```

**Note:** For security, the response is generic regardless of whether the email exists.

#### Step 2: Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```javascript
export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, newPassword })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Password reset failed');
  }
  
  const data = await response.json();
  return data;
};
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

## 🛠️ Admin Operations

### 1. Update Admin Profile

**Endpoint:** `PATCH /api/admin/profile`

**Request:**
```javascript
export const updateAdminProfile = async (updates) => {
  const response = await fetch(`${API_BASE_URL}/admin/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Update failed');
  }
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "email": "newemail@interior.com",
  "newPassword": "newSecurePassword123"  // Optional
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "email": "newemail@interior.com"
}
```

---

### 2. Client Management

#### Get All Clients

**Endpoint:** `GET /api/admin/clients`

**Request:**
```javascript
export const getAllClients = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/clients`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  
  return await response.json();
};
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "JohnDoe",
    "isBlocked": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "username": "JaneSmith",
    "isBlocked": false,
    "createdAt": "2024-01-16T14:20:00.000Z"
  }
]
```

#### Create New Client

**Endpoint:** `POST /api/admin/clients`

**Request:**
```javascript
export const createClient = async (username, pin) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, pin })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create client');
  }
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "username": "JohnDoe",
  "pin": "1234"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "JohnDoe",
  "isBlocked": false,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `username`: Required, unique, 3-50 characters
- `pin`: Required, exactly 4 digits

#### Reset Client PIN

**Endpoint:** `PATCH /api/admin/clients/:id/reset-pin`

**Request:**
```javascript
export const resetClientPin = async (clientId, newPin) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/reset-pin`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPin })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset PIN');
  }
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "newPin": "9876"
}
```

**Response:**
```json
{
  "message": "Client PIN updated successfully"
}
```

#### Block/Unblock Client

**Endpoints:** 
- `PATCH /api/admin/clients/:id/block`
- `PATCH /api/admin/clients/:id/unblock`

**Request:**
```javascript
export const blockClient = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/block`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to block client');
  }
  
  return await response.json();
};

export const unblockClient = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/unblock`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to unblock client');
  }
  
  return await response.json();
};
```

**Response:**
```json
{
  "message": "Client blocked successfully"
}
```

---

## 🏗️ Project Management

### 1. Create Project

**Endpoint:** `POST /api/projects`

**Request:**
```javascript
export const createProject = async (projectData) => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create project');
  }
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Master Bedroom Renovation",
  "description": "Complete renovation including lamination, lighting, and furniture"
}
```

**Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Master Bedroom Renovation",
  "description": "Complete renovation including lamination, lighting, and furniture",
  "status": "PENDING",
  "createdAt": "2024-01-20T09:00:00.000Z",
  "updatedAt": "2024-01-20T09:00:00.000Z"
}
```

**Status Values:**
- `PENDING` - Project created, not started
- `IN_PROGRESS` - Work is ongoing
- `DELAYED` - Project is behind schedule
- `COMPLETED` - Project finished

---

### 2. Get All Projects (Admin)

**Endpoint:** `GET /api/projects`

**Request:**
```javascript
export const getAllProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  return await response.json();
};
```

**Response:**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "clientId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Master Bedroom Renovation",
    "description": "Complete renovation including lamination, lighting, and furniture",
    "status": "IN_PROGRESS",
    "createdAt": "2024-01-20T09:00:00.000Z",
    "updatedAt": "2024-01-22T14:30:00.000Z",
    "client": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "JohnDoe"
    }
  }
]
```

---

### 3. Get Project Details

**Endpoint:** `GET /api/projects/:id`

**Request:**
```javascript
export const getProjectDetail = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch project details');
  }
  
  return await response.json();
};
```

**Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Master Bedroom Renovation",
  "description": "Complete renovation including lamination, lighting, and furniture",
  "status": "IN_PROGRESS",
  "createdAt": "2024-01-20T09:00:00.000Z",
  "updatedAt": "2024-01-22T14:30:00.000Z",
  "entries": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "fileUrl": "uploads/projects/1234567890-image.jpg",
      "fileType": "IMAGE",
      "description": "Initial demolition completed",
      "createdAt": "2024-01-21T10:00:00.000Z"
    }
  ]
}
```

---

### 4. Update Project Status

**Endpoint:** `PATCH /api/projects/:id/status`

**Request:**
```javascript
export const updateProjectStatus = async (projectId, status) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update status');
  }
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Valid Status Values:**
- `PENDING`
- `IN_PROGRESS`
- `DELAYED`
- `COMPLETED`

**Response:**
```json
{
  "message": "Project status updated successfully",
  "project": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "IN_PROGRESS",
    "updatedAt": "2024-01-22T14:30:00.000Z"
  }
}
```

---

### 5. Delete Project

**Endpoint:** `DELETE /api/projects/:id`

**Request:**
```javascript
export const deleteProject = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
  
  return await response.json();
};
```

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

---

## 🏠 Client Portal

### Get My Projects (Client View)

**Endpoint:** `GET /api/my-projects`

**Request:**
```javascript
export const getMyProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/my-projects`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  return await response.json();
};
```

**Response:**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Master Bedroom Renovation",
    "description": "Complete renovation including lamination, lighting, and furniture",
    "status": "IN_PROGRESS",
    "createdAt": "2024-01-20T09:00:00.000Z",
    "updatedAt": "2024-01-22T14:30:00.000Z",
    "entries": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "fileUrl": "uploads/projects/1234567890-image.jpg",
        "fileType": "IMAGE",
        "description": "Initial demolition completed",
        "createdAt": "2024-01-21T10:00:00.000Z"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440004",
        "fileUrl": "uploads/projects/1234567891-video.mp4",
        "fileType": "VIDEO",
        "description": "Ceiling work progress",
        "createdAt": "2024-01-22T14:00:00.000Z"
      }
    ]
  }
]
```

---

## 📸 Media Upload & Display

### 1. Upload Project Entry (Image/Video)

**Endpoint:** `POST /api/projects/:id/entries`

**⚠️ IMPORTANT:** This endpoint uses `multipart/form-data` for file uploads.

**Request:**
```javascript
// ⚠️ IMPORTANT: This endpoint uses multipart/form-data for bulk uploads.
// It accepts multiple files in the 'media' field and returns an ARRAY of entries.

export const uploadProjectEntries = async (projectId, files, description) => {
  const formData = new FormData();
  
  // Attach all files to the 'media' field
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
    }
  }

  formData.append('description', description);
  
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/entries`, {
    method: 'POST',
    headers: getAuthHeadersMultipart(), // No Content-Type header!
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }
  
  return await response.json(); // Returns an ARRAY of created entries
};
```

**Supported File Types:**
- **Images:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Videos:** `.mp4`, `.mov`, `.avi`, `.mkv`

**File Size Limits:**
- Maximum file size: 50MB (configurable in backend)

**Response:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "projectId": "770e8400-e29b-41d4-a716-446655440002",
  "fileUrl": "uploads/projects/1234567890-bedroom-progress.jpg",
  "fileType": "IMAGE",
  "description": "Ceiling work finished",
  "createdAt": "2024-01-21T10:00:00.000Z"
}
```

**React Component Example:**
```jsx
import React, { useState } from 'react';
import { uploadProjectEntry } from '../services/projectService';

function UploadForm({ projectId }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadProjectEntry(projectId, file, description);
      console.log('Upload successful:', result);
      alert('Upload successful!');
      setFile(null);
      setDescription('');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

---

### 2. Get Project Entries

**Endpoint:** `GET /api/projects/:id/entries`

**Request:**
```javascript
export const getProjectEntries = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/entries`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch entries');
  }
  
  return await response.json();
};
```

**Response:**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "projectId": "770e8400-e29b-41d4-a716-446655440002",
    "fileUrl": "uploads/projects/1234567890-image.jpg",
    "fileType": "IMAGE",
    "description": "Initial demolition completed",
    "createdAt": "2024-01-21T10:00:00.000Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "projectId": "770e8400-e29b-41d4-a716-446655440002",
    "fileUrl": "uploads/projects/1234567891-video.mp4",
    "fileType": "VIDEO",
    "description": "Ceiling work progress",
    "createdAt": "2024-01-22T14:00:00.000Z"
  }
]
```

---

### 3. Displaying Media in Frontend

**React Component Example:**
```jsx
import React from 'react';
import { MEDIA_BASE_URL } from '../config/api';

function MediaDisplay({ entry }) {
  const fullUrl = `${MEDIA_BASE_URL}/${entry.fileUrl}`;

  if (entry.fileType === 'IMAGE') {
    return (
      <img 
        src={fullUrl} 
        alt={entry.description}
        className="w-full h-auto rounded-lg"
      />
    );
  }

  if (entry.fileType === 'VIDEO') {
    return (
      <video controls className="w-full h-auto rounded-lg">
        <source src={fullUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  if (entry.fileType === 'PDF') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 border rounded-lg">
        <FileText className="w-12 h-12 text-rose-500 mb-2" />
        <p className="text-sm font-medium mb-4">PDF Document</p>
        <a 
          href={fullUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-cs-primary-100 text-white rounded-md text-sm font-bold"
        >
          View PDF
        </a>
      </div>
    );
  }

  return null;
}

function ProjectGallery({ entries }) {
  return (
    <div className="gallery">
      {entries.map(entry => (
        <MediaDisplay key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
```

**HTML/Vanilla JS Example:**
```javascript
function renderMedia(entry) {
  const fullUrl = `${MEDIA_BASE_URL}/${entry.fileUrl}`;
  
  if (entry.fileType === 'IMAGE') {
    return `
      <div class="media-entry">
        <img src="${fullUrl}" alt="${entry.description}" />
        <p>${entry.description}</p>
      </div>
    `;
  } else {
    return `
      <div class="media-entry">
        <video controls>
          <source src="${fullUrl}" type="video/mp4" />
        </video>
        <p>${entry.description}</p>
      </div>
    `;
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

All API errors follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

### Common HTTP Status Codes

| Status Code | Meaning | Common Causes |
|------------|---------|---------------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid input data, validation errors |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., username exists) |
| `500` | Server Error | Internal server error |

### Error Handling Best Practices

```javascript
// Comprehensive error handler
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 401:
          // Token expired or invalid - redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
          
        case 403:
          throw new Error('You do not have permission to perform this action.');
          
        case 404:
          throw new Error('Resource not found.');
          
        case 409:
          throw new Error(errorData.message || 'Resource already exists.');
          
        case 500:
          throw new Error('Server error. Please try again later.');
          
        default:
          throw new Error(errorData.message || 'An error occurred.');
      }
    }
    
    return await response.json();
    
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
}
```

---

## 💻 Code Examples

### Complete Service Layer

```javascript
// src/services/api.js
import { API_BASE_URL, MEDIA_BASE_URL, getAuthHeaders, getAuthHeadersMultipart } from '../config/api';

// ============ AUTH ============
export const adminLogin = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('userRole', data.role);
  return data;
};

export const clientLogin = async (username, pin) => {
  const response = await fetch(`${API_BASE_URL}/auth/client/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('userRole', data.role);
  return data;
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
};

// ============ CLIENTS ============
export const getAllClients = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/clients`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch clients');
  return await response.json();
};

export const createClient = async (username, pin) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, pin })
  });
  if (!response.ok) throw new Error('Failed to create client');
  return await response.json();
};

export const resetClientPin = async (clientId, newPin) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/reset-pin`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPin })
  });
  if (!response.ok) throw new Error('Failed to reset PIN');
  return await response.json();
};

export const blockClient = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/block`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to block client');
  return await response.json();
};

export const unblockClient = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/unblock`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to unblock client');
  return await response.json();
};

// ============ PROJECTS ============
export const createProject = async (clientId, title, description) => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ clientId, title, description })
  });
  if (!response.ok) throw new Error('Failed to create project');
  return await response.json();
};

export const getAllProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch projects');
  return await response.json();
};

export const getProjectDetail = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch project');
  return await response.json();
};

export const updateProjectStatus = async (projectId, status) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update status');
  return await response.json();
};

export const deleteProject = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete project');
  return await response.json();
};

export const getMyProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/my-projects`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch projects');
  return await response.json();
};

// ============ PROJECT ENTRIES ============
export const uploadProjectEntries = async (projectId, files, description) => {
  const formData = new FormData();
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
    }
  }
  formData.append('description', description);
  
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/entries`, {
    method: 'POST',
    headers: getAuthHeadersMultipart(),
    body: formData
  });
  if (!response.ok) throw new Error('Upload failed');
  return await response.json();
};

export const getProjectEntries = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/entries`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch entries');
  return await response.json();
};

// ============ HELPERS ============
export const getMediaUrl = (fileUrl) => {
  return `${MEDIA_BASE_URL}/${fileUrl}`;
};
```

---

### React Hook Example

```javascript
// src/hooks/useProjects.js
import { useState, useEffect } from 'react';
import { getAllProjects, getMyProjects } from '../services/api';

export function useProjects(isAdmin = false) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = isAdmin ? await getAllProjects() : await getMyProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAdmin]);

  return { projects, loading, error, refetch: () => fetchProjects() };
}
```

---

## 🔒 Security Best Practices

### 1. Token Storage
```javascript
// Store tokens securely
localStorage.setItem('authToken', token);

// Always check token before making requests
const token = localStorage.getItem('authToken');
if (!token) {
  // Redirect to login
  window.location.href = '/login';
}
```

### 2. Token Expiration Handling
```javascript
// Add axios interceptor or fetch wrapper
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      // Token expired
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 3. Role-Based Access Control
```javascript
// Check user role before rendering admin features
const userRole = localStorage.getItem('userRole');

if (userRole === 'ADMIN') {
  // Show admin features
} else if (userRole === 'CLIENT') {
  // Show client features
}
```

---

## 📱 Testing with Postman/Thunder Client

### Example Collection Structure

```
Interior Design API
├── Auth
│   ├── Admin Login
│   ├── Client Login
│   ├── Request Password Reset
│   └── Reset Password
├── Admin
│   ├── Get All Clients
│   ├── Create Client
│   ├── Reset Client PIN
│   ├── Block Client
│   └── Update Profile
├── Projects
│   ├── Create Project
│   ├── Get All Projects
│   ├── Get Project Detail
│   ├── Update Project Status
│   └── Delete Project
└── Project Entries
    ├── Upload Entry
    └── Get Entries
```

### Environment Variables for Testing
```json
{
  "baseUrl": "http://72.60.219.145:5004/api",
  "adminToken": "",
  "clientToken": "",
  "testClientId": "",
  "testProjectId": ""
}
```

---

## 🎯 Quick Reference Checklist

### Before Integration:
- [ ] Backend server is running on `http://72.60.219.145:5004`
- [ ] Environment variables configured in frontend
- [ ] API client setup with base URL and headers
- [ ] Token storage mechanism implemented

### Authentication:
- [ ] Admin login working
- [ ] Client login working
- [ ] Token stored in localStorage
- [ ] Auth headers added to protected requests
- [ ] Logout functionality implemented

### Admin Features:
- [ ] Client management (CRUD)
- [ ] Project creation
- [ ] Project status updates
- [ ] Media upload working

### Client Features:
- [ ] Client can login with PIN
- [ ] Client can view their projects
- [ ] Media displays correctly (images and videos)

### Error Handling:
- [ ] 401 errors redirect to login
- [ ] User-friendly error messages
- [ ] Network error handling
- [ ] Loading states implemented

---

## 📞 Support & Troubleshooting

### Common Issues:

**1. CORS Errors**
- Ensure backend has CORS enabled for your frontend origin
- Check that credentials are included in requests if needed

**2. 401 Unauthorized**
- Check if token is stored correctly
- Verify token is sent in Authorization header
- Check if token has expired

**3. File Upload Fails**
- Ensure `Content-Type` header is NOT set for multipart requests
- Verify file size is within limits
- Check file type is supported

**4. Images/Videos Not Displaying**
- Verify `MEDIA_BASE_URL` is correct
- Check that `fileUrl` path is appended correctly
- Ensure uploads directory is accessible

---

## 📚 Additional Resources

- **Swagger Documentation:** `http://72.60.219.145:5004/api-docs` (if enabled)
- **Backend Repository:** Check README for setup instructions
- **Postman Collection:** Import the API collection for testing

---

**Last Updated:** February 2026  
**API Version:** 1.0.0  
**Backend Framework:** Express.js + TypeScript  
**Database:** PostgreSQL with Prisma ORM
