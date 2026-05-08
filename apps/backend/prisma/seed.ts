import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@research.com'
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@1234'
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: 'System Admin',
            email: adminEmail,
            password_hash: passwordHash,
            role: 'ADMIN',
            is_active: true,
            specialty: 'Administration',
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
