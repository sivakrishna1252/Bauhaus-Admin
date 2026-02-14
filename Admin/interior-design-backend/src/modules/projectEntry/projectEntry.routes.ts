import { Router } from 'express';
import { createProjectEntry, getProjectEntries, updateProjectEntry, deleteProjectEntry } from './projectEntry.controller.js';
import { authenticate } from '../../middleware/auth.js';
import upload from '../../middleware/upload.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Project Entries
 *   description: Project progress updates and image uploads
 */

/**
 * @swagger
 * /api/projects/{id}/entries:
 *   post:
 *     summary: Add project entry with image (Admin only)
 *     tags: [Project Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [TIMELINE, AGREEMENT, PAYMENT_INVOICE, HANDOVER, CERTIFICATE]
 *                 default: TIMELINE
 *     responses:
 *       201:
 *         description: Entry created
 */
router.post('/projects/:id/entries', authenticate('ADMIN'), upload.array('media', 20), createProjectEntry);

/**
 * @swagger
 * /api/projects/{id}/entries:
 *   get:
 *     summary: Get entries for a project
 *     tags: [Project Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of entries
 */
router.get('/projects/:id/entries', authenticate(), getProjectEntries);

/**
 * @swagger
 * /api/projects/entries/{id}:
 *   patch:
 *     summary: Update project entry
 *     tags: [Project Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [TIMELINE, AGREEMENT, PAYMENT_INVOICE, HANDOVER, CERTIFICATE]
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Entry updated
 */
router.patch('/projects/entries/:id', authenticate('ADMIN'), upload.array('media', 20), updateProjectEntry);

/**
 * @swagger
 * /api/projects/entries/{id}:
 *   delete:
 *     summary: Delete project entry
 *     tags: [Project Entries]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/projects/entries/:id', authenticate('ADMIN'), deleteProjectEntry);

export default router;
