import { Request, Response } from 'express';
import { prisma } from '../../index.js';
import { hashSecret } from '../../utils/hash.js';
import bcrypt from 'bcrypt';
import { sendClientWelcomeCredentials, sendClientPinUpdated } from '../../utils/notifications.js';

export const getAllClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(clients);
    } catch (error) {
        console.error('Get All Clients Error:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const createClient = async (req: Request, res: Response) => {
    const { username, pin, email } = req.body;
    console.log('--- CREATE CLIENT ATTEMPT ---');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('PIN:', pin ? '****' : 'MISSING');

    try {
        console.log('Checking for existing client...');
        const existingClient = await prisma.client.findUnique({ where: { username } });
        if (existingClient) {
            console.log('Client already exists with username:', username);
            return res.status(400).json({ message: 'Name already taken' });
        }

        if (email) {
            console.log('Checking for existing email...');
            const existingEmail = await prisma.client.findFirst({ where: { email } });
            if (existingEmail) {
                console.log('Email already exists:', email);
                return res.status(400).json({ message: 'Email already registered' });
            }
        }

        console.log('Checking for PIN uniqueness...');
        const allClients = await prisma.client.findMany({
            select: { pinHash: true }
        });

        for (const c of allClients) {
            const isMatch = await bcrypt.compare(pin, c.pinHash);
            if (isMatch) {
                console.log('PIN already taken');
                return res.status(400).json({ message: 'PIN already taken by another client' });
            }
        }

        console.log('Hashing PIN...');
        const pinHash = await hashSecret(pin);

        console.log('Creating client in database...');
        const client = await (prisma as any).client.create({
            data: {
                username,
                pinHash,
                email,
                welcomePin: pin // Store raw PIN until setup is finalized
            },
        });

        console.log('Client created successfully:', client.id);

        // Send welcome credentials email to the new client
        if (email) {
            await sendClientWelcomeCredentials(email, username, pin);
        }

        res.status(201).json({ id: client.id, username: client.username, email: client.email });
    } catch (error: any) {
        console.error('CRITICAL ERROR in createClient:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            stack: error.stack
        });
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
        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                pinHash,
                welcomePin: newPin
            },
        });

        // Send PIN update notification to the client if they have an email
        if ((updatedClient as any).email) {
            await sendClientPinUpdated((updatedClient as any).email, updatedClient.username, newPin);
        }

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
