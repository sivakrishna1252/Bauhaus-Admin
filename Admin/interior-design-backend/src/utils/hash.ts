import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashSecret = async (secret: string): Promise<string> => {
    return await bcrypt.hash(secret, SALT_ROUNDS);
};

export const compareSecret = async (secret: string, hashedSecret: string): Promise<boolean> => {
    return await bcrypt.compare(secret, hashedSecret);
};
