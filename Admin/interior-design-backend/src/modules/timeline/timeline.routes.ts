import { Router } from 'express';
import {
    createTimelineStep,
    updateTimelineStep,
    completeTimelineStep,
    feedbackTimelineStep,
    getProjectTimelineWithLogs,
    addDailyLog,
    generateFinalDocument,
    deleteTimelineStep,
    bulkUpdateTimeline,
    initializeProject,
    clearProjectTimeline
} from './timeline.controller.js';
import { authenticate } from '../../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// Storage configuration for timeline completion uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/timeline/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Timeline
 *   description: Project timeline and task management API
 */

// Admin: Add step
router.post('/projects/:projectId/timeline', authenticate('ADMIN'), createTimelineStep);

// Admin: Update step (e.g., deadline change with reason)
router.patch('/timeline/:id', authenticate('ADMIN'), updateTimelineStep);

// Admin: Complete step (Upload work for review)
router.post('/timeline/:id/complete', authenticate('ADMIN'), upload.array('media', 50), completeTimelineStep);

// Admin: Add daily log
router.post('/timeline/:id/logs', authenticate('ADMIN'), addDailyLog);

// Admin: Generate Final PDF
router.post('/projects/:id/generate-document', authenticate('ADMIN'), generateFinalDocument);

// Client: Approve/Reject step
router.post('/timeline/:id/feedback', authenticate('CLIENT'), upload.array('media', 50), feedbackTimelineStep);

// General: Get timeline for a project
router.get('/projects/:projectId/timeline', authenticate(), getProjectTimelineWithLogs);

// Admin: Bulk update timeline
router.patch('/projects/:projectId/timeline/bulk-update', authenticate('ADMIN'), bulkUpdateTimeline);

// Admin: Mark project setup complete (Notify client)
router.post('/projects/:projectId/timeline/initialize', authenticate('ADMIN'), initializeProject);

// Admin: Delete step
router.delete('/timeline/:id', authenticate('ADMIN'), deleteTimelineStep);

// Admin: Clear all milestones for a project
router.delete('/projects/:projectId/timeline', authenticate('ADMIN'), clearProjectTimeline);

export default router;
