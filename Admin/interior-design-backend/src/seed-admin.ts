import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Now reading directly from .env! Client just changes the text file.
    const email = process.env.ADMIN_EMAIL || 'admin@interior.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.upsert({
        where: { email },
        update: {
            passwordHash: passwordHash // This allows password resets!
        },
        create: {
            email,
            passwordHash,
        },
    });

    console.log('✅ Admin credentials synced from .env');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: (as defined in .env)');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
