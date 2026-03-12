import jwt, { SignOptions } from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: any, expiresIn: string | number = '1d') => {
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, getSecret(), options);
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, getSecret());
    } catch (error) {
        return null;
    }
};
