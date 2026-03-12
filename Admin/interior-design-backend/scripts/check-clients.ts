import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkClients() {
    const clients = await prisma.client.findMany({
        select: {
            username: true,
            welcomePin: true,
            email: true,
            welcomeSent: true
        },
        take: 10
    });

    console.log('Total clients found:', clients.length);
    console.log(JSON.stringify(clients, null, 2));
}

checkClients()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
