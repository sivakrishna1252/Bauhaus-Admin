import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: 'ADMIN' | 'CLIENT';
        username?: string;
        email?: string;
    };
}

export const authenticate = (role?: 'ADMIN' | 'CLIENT') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token) as any;

        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        if (role && decoded.role !== role) {
            return res.status(403).json({ message: `Forbidden: Requires ${role} role` });
        }

        req.user = decoded;
        next();
    };
};
