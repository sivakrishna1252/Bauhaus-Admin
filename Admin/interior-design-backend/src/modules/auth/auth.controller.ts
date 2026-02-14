import { Request, Response } from 'express';
import { prisma } from '../../index.js';
import { compareSecret, hashSecret } from '../../utils/hash.js';
import { generateToken } from '../../utils/token.js';
import crypto from 'crypto';

export const adminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await compareSecret(password, admin.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: admin.id, role: 'ADMIN', email: admin.email });
        res.json({ token, role: 'ADMIN' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const unifiedLogin = async (req: Request, res: Response) => {
    const { identifier, secret } = req.body;

    try {
        // 1. Try Admin by email
        const admin = await prisma.admin.findUnique({ where: { email: identifier } });
        if (admin) {
            const isMatch = await compareSecret(secret, admin.passwordHash);
            if (isMatch) {
                const token = generateToken({ id: admin.id, role: 'ADMIN', email: admin.email });
                return res.json({ token, role: 'ADMIN' });
            }
        }

        // 2. Try Client by username
        const client = await prisma.client.findUnique({ where: { username: identifier } });
        if (client) {
            if (client.isBlocked) {
                return res.status(403).json({ message: 'Account is blocked' });
            }
            const isMatch = await compareSecret(secret, client.pinHash);
            if (isMatch) {
                const token = generateToken({ id: client.id, role: 'CLIENT', username: client.username });
                return res.json({ token, role: 'CLIENT' });
            }
        }

        return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const clientLogin = async (req: Request, res: Response) => {
    const { username, pin } = req.body;

    try {
        const client = await prisma.client.findUnique({ where: { username } });
        if (!client) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (client.isBlocked) {
            return res.status(403).json({ message: 'Account is blocked' });
        }

        const isMatch = await compareSecret(pin, client.pinHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: client.id, role: 'CLIENT', username: client.username });
        res.json({ token, role: 'CLIENT' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// NEW: Request a password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });

        // SECURITY TRICK: Even if the admin doesn't exist, we don't tell the attacker.
        // We always return the same "Success" message.
        if (!admin) {
            return res.json({ message: 'If an account exists with this email, you will receive a reset link shortly.' });
        }

        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // Expires in 1 hour


        await prisma.admin.update({
            where: { email },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry
            } as any
        });


        // In production: Send email. For now: Log it to console.
        console.log(`🔗 RESET LINK: http://localhost:5000/admin/reset-password.html?token=${token}`);

        res.json({ message: 'Instructions sent to email (check server logs for link)' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// NEW: Reset password using token
export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    try {
        const admin = await prisma.admin.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() } // Must be valid and not expired
            } as any
        });


        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        const newHash = await hashSecret(newPassword);

        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                passwordHash: newHash,
                resetToken: null,
                resetTokenExpiry: null
            } as any
        });


        res.json({ message: 'Password updated successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
