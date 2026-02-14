import { Router } from 'express';
import { getAllClients, createClient, resetClientPin, blockClient, unblockClient, updateAdminProfile, deleteClient } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate('ADMIN'));

/**
 * @swagger
 * /api/admin/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/clients', getAllClients);

/**
 * @swagger
 * /api/admin/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               pin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created
 */
router.post('/clients', createClient);

/**
 * @swagger
 * /api/admin/clients/{id}/reset-pin:
 *   patch:
 *     summary: Reset client PIN
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *               newPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: PIN reset successfully
 */
router.patch('/clients/:id/reset-pin', resetClientPin);

/**
 * @swagger
 * /api/admin/clients/{id}/block:
 *   patch:
 *     summary: Block a client
 *     tags: [Admin]
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
 *         description: Client blocked
 */
router.patch('/clients/:id/block', blockClient);

/**
 * @swagger
 * /api/admin/clients/{id}/unblock:
 *   patch:
 *     summary: Unblock a client
 *     tags: [Admin]
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
 *         description: Client unblocked
 */
router.patch('/clients/:id/unblock', unblockClient);
+
    +/**
+ * @swagger
+ * /api/admin/clients/{id}:
+ *   delete:
+ *     summary: Delete a client and all their projects
+ *     tags: [Admin]
+ *     security:
+ *       - bearerAuth: []
+ *     parameters:
+ *       - in: path
+ *         name: id
+ *         required: true
+ *         schema:
+ *           type: string
+ *     responses:
+ *       200:
+ *         description: Client deleted
+ */
    +router.delete('/clients/:id', deleteClient);



/**
 * @swagger
 * /api/admin/profile:
 *   patch:
 *     summary: Update your own profile (Email/Password)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/profile', authenticate('ADMIN'), updateAdminProfile);

export default router;
