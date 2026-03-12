import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { phone: '+1234567890' },
      update: {},
      create: {
        phone: '+1234567890',
        name: 'Alice Smith',
        username: 'alice',
        about: 'Hey there! I am using NexChat.',
        avatarUrl: 'https://i.pravatar.cc/150?u=alice',
        privacy: { create: {} },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+0987654321' },
      update: {},
      create: {
        phone: '+0987654321',
        name: 'Bob Jones',
        username: 'bob',
        about: 'Available',
        avatarUrl: 'https://i.pravatar.cc/150?u=bob',
        privacy: { create: {} },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+1112223333' },
      update: {},
      create: {
        phone: '+1112223333',
        name: 'Charlie Brown',
        username: 'charlie',
        about: 'Busy',
        avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
        isVerifiedBusiness: true,
        privacy: { create: {} },
        businessProfile: {
          create: {
            businessName: 'Charlie Cafe',
            category: 'Restaurant',
            description: 'Best coffee in town',
            email: 'hello@charliecafe.com',
            address: '123 Main St, Cityville',
          }
        }
      },
    }),
  ]);

  console.log(`Created ${users.length} users.`);

  // 2. Add Contacts
  await prisma.contact.upsert({
    where: { userId_contactId: { userId: users[0].id, contactId: users[1].id } },
    update: {},
    create: { userId: users[0].id, contactId: users[1].id },
  });
  await prisma.contact.upsert({
    where: { userId_contactId: { userId: users[1].id, contactId: users[0].id } },
    update: {},
    create: { userId: users[1].id, contactId: users[0].id },
  });

  console.log('Contacts created.');

  // 3. Create a Direct Chat between Alice and Bob
  const existingChat = await prisma.chatParticipant.findFirst({
    where: {
      userId: users[0].id,
      chat: { type: 'DIRECT' },
    },
    include: { chat: { include: { participants: true } } },
  });

  if (!existingChat) {
    const chat = await prisma.chat.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId: users[0].id },
            { userId: users[1].id },
          ],
        },
      },
    });

    // 4. Add Initial Message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: users[0].id,
        type: 'TEXT',
        content: 'Hi Bob! Welcome to NexChat!',
        sentAt: new Date(),
        statuses: {
          create: [
            { userId: users[1].id, status: 'DELIVERED' }
          ]
        }
      },
    });

    console.log('Created direct chat and initial message.');
  }

  console.log('Database seeding completed successfully. 🌱');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
