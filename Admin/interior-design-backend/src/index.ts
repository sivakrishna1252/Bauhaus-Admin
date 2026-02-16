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
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import projectRoutes from './modules/project/project.routes.js';
import projectEntryRoutes from './modules/projectEntry/projectEntry.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Prisma 7 programmatic configuration
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const app = express();
export const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve the Admin Panel (Frontend)
app.use('/admin', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', projectRoutes);
app.use('/api', projectEntryRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Interior Design Backend is running' });
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
    console.log(`Swagger docs available at http://72.60.219.145:${PORT}/api-docs`);
});
