import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { id: "user-alice", name: "Alice Owner", email: "alice@example.com" },
  { id: "user-bob", name: "Bob Editor", email: "bob@example.com" },
  { id: "user-carol", name: "Carol Viewer", email: "carol@example.com" },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
