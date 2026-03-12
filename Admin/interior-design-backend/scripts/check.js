import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function run() {
    const clients = await prisma.client.findMany({
        select: {
            username: true,
            welcomePin: true,
            welcomeSent: true
        }
    });
    console.log(JSON.stringify(clients, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
