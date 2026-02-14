import { Request, Response } from 'express';
import { prisma } from '../../index.js';
import { hashSecret } from '../../utils/hash.js';
import bcrypt from 'bcrypt';


export const getAllClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const createClient = async (req: Request, res: Response) => {
    const { username, pin } = req.body;

    try {
        const existingClient = await prisma.client.findUnique({ where: { username } });
        if (existingClient) {
            return res.status(400).json({ message: 'Name already taken' });
        }

        // Check if PIN is already taken by any other client
        const allClients = await prisma.client.findMany({
            select: { pinHash: true }
        });

        for (const client of allClients) {
            const isMatch = await bcrypt.compare(pin, client.pinHash);
            if (isMatch) {
                return res.status(400).json({ message: 'PIN already taken' });
            }
        }

        const pinHash = await hashSecret(pin);
        const client = await prisma.client.create({
            data: {
                username,
                pinHash,
            },
        });

        res.status(201).json({ id: client.id, username: client.username });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const resetClientPin = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { newPin } = req.body;

    try {
        // Check if new PIN is already taken by any other client
        const allClients = await prisma.client.findMany({
            where: { NOT: { id } },
            select: { pinHash: true }
        });

        for (const client of allClients) {
            const isMatch = await bcrypt.compare(newPin, client.pinHash);
            if (isMatch) {
                return res.status(400).json({ message: 'PIN already taken' });
            }
        }

        const pinHash = await hashSecret(newPin);
        await prisma.client.update({
            where: { id },
            data: { pinHash },
        });

        res.json({ message: 'Client PIN updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const blockClient = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
        await prisma.client.update({
            where: { id },
            data: { isBlocked: true },
        });

        res.json({ message: 'Client blocked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const unblockClient = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
        await prisma.client.update({
            where: { id },
            data: { isBlocked: false },
        });

        res.json({ message: 'Client unblocked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
// NEW: Delete client and all associated data
export const deleteClient = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
        // 1. Get all file URLs for this client's projects before deleting records
        const entries = await prisma.projectEntry.findMany({
            where: {
                project: {
                    clientId: id
                }
            },
            select: { fileUrl: true }
        });

        // 2. Delete the client from DB (Cascade will handle Projects and Entries in DB)
        await prisma.client.delete({
            where: { id }
        });

        // 3. Delete physical files from disk
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        for (const entry of entries) {
            try {
                // fileUrl is something like "uploads/projects/abc.jpg"
                const filePath = path.join(__dirname, '../../..', entry.fileUrl);
                await fs.unlink(filePath);
            } catch (err) {
                console.error(`Failed to delete file: ${entry.fileUrl}`, err);
            }
        }

        res.json({ message: 'Client and all associated projects/files deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting client', error });
    }
};


// NEW: Admin update their own profile (Email or Password)
export const updateAdminProfile = async (req: any, res: Response) => {
    const adminId = req.user.id; // From JWT token
    const { email, newPassword } = req.body;

    try {
        const updateData: any = {};
        if (email) updateData.email = email;
        if (newPassword) {
            updateData.passwordHash = await hashSecret(newPassword);
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: updateData
        });

        res.json({ message: 'Profile updated successfully', email: updatedAdmin.email });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error });
    }
};

