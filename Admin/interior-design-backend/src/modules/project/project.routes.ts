import { Router } from 'express';
import {
    createProject,
    getAllProjects,
    updateProjectStatus,
    deleteProject,
    getMyProjects,
    getProjectDetail
} from './project.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management API
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/projects', authenticate('ADMIN'), createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all projects
 */
router.get('/projects', authenticate('ADMIN'), getAllProjects);

/**
 * @swagger
 * /api/projects/{id}/status:
 *   patch:
 *     summary: Update project status (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, DELAYED, COMPLETED]
 *     responses:
 *       200:
 *         description: Project status updated
 */
router.patch('/projects/:id/status', authenticate('ADMIN'), updateProjectStatus);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 */
router.delete('/projects/:id', authenticate('ADMIN'), deleteProject);

/**
 * @swagger
 * /api/my-projects:
 *   get:
 *     summary: Get own projects (Client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects for the logged in client
 */
router.get('/my-projects', authenticate('CLIENT'), getMyProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project detail
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/projects/:id', authenticate(), getProjectDetail);

export default router;
