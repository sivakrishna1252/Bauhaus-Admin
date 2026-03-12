import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Find the first project
    const project = await prisma.project.findFirst({
        include: { client: true }
    });

    if (!project) {
        console.log('❌ No project found to seed timeline. Please create a project first.');
        return;
    }

    console.log(`🌱 Seeding timeline for Project: ${project.title}`);

    // Design Timeline Steps
    const designSteps = [
        {
            title: 'Site Measurement',
            description: 'Site measurement in interior design records space dimensions and features for accurate planning.',
            startDate: new Date('2025-09-16'),
            endDate: new Date('2025-09-20'),
            type: 'DESIGN' as any,
            order: 1,
            status: 'APPROVED' as any
        },
        {
            title: '1st Design Meeting (Site)',
            description: 'The meeting will cover the floor plan and civil changes for discussion.',
            startDate: new Date('2025-09-20'),
            endDate: new Date('2025-09-21'),
            type: 'DESIGN' as any,
            order: 2,
            status: 'APPROVED' as any
        },
        {
            title: 'Mood Board / Concept Presentation',
            description: 'A moodboard visually represents colors, materials, and inspirations to define the design style.',
            startDate: new Date('2025-09-25'),
            endDate: new Date('2025-09-27'),
            type: 'DESIGN' as any,
            order: 3,
            status: 'IN_REVIEW' as any
        }
    ];

    for (const stepData of designSteps) {
        await (prisma as any).timelineStep.create({
            data: {
                ...stepData,
                projectId: project.id
            }
        });
    }

    console.log('✅ Timeline steps seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding timeline:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
