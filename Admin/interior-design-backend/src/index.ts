import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { prisma } from './config/db.js';
export { prisma };

import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import projectRoutes from './modules/project/project.routes.js';
import projectEntryRoutes from './modules/projectEntry/projectEntry.routes.js';
import timelineRoutes from './modules/timeline/timeline.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();


export const app = express();

const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/timeline', express.static(path.join(__dirname, '../uploads/timeline')));

// Serve the Admin Panel (Frontend)
app.use('/admin', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', projectRoutes);
app.use('/api', projectEntryRoutes);
app.use('/api', timelineRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'Project Backend is running',
        port: PORT,
        secretPrefix: process.env.JWT_SECRET ? process.env.JWT_SECRET.slice(0, 4) : 'MISSING'
    });
});

// Redirect root to admin
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err.message);

    // Handle Multer specific errors
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            message: 'Invalid field name in upload. Please use the "image" field for your file.',
            error: err.code
        });
    }

    if (err.message && err.message.includes('Only images and videos')) {
        return res.status(400).json({
            message: err.message,
            error: 'INVALID_FILE_TYPE'
        });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    // console.log(`Admin Panel available at http://72.60.219.145:${PORT}/admin`);
});
