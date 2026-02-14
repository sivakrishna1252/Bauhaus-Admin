import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: any, expiresIn: string | number = '1d') => {
    const options: SignOptions = { expiresIn: expiresIn as any }; // Cast to any to avoid strict type mismatch if any
    return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};
