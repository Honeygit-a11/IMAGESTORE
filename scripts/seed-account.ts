import prisma, { ensureDatabaseReady } from "../src/lib/db/prisma";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  console.log("🌱 Starting account seeding...");

  await ensureDatabaseReady();

  const email = "demo@imagespace.io";
  const rawPassword = "DemoPassword123!";
  const name = "Demo User";
  const passwordHash = await hashPassword(rawPassword);

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        authProvider: "CREDENTIALS",
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Created user: ${email} (ID: ${user.id})`);
  } else {
    user = await prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash,
        emailVerified: user.emailVerified || new Date(),
      },
    });
    console.log(`🔄 Updated existing user: ${email} (ID: ${user.id})`);
  }

  // Check if user has an active workspace
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (!existingMembership) {
    const workspaceName = `${name}'s Workspace`;
    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        activityLogs: {
          create: {
            userId: user.id,
            action: "WORKSPACE_CREATED",
            metadata: { workspaceName },
          },
        },
      },
    });
    console.log(`✅ Created workspace: "${workspace.name}" (ID: ${workspace.id})`);
  } else {
    console.log(`ℹ️ User already has workspace: "${existingMembership.workspace.name}" (ID: ${existingMembership.workspace.id})`);
  }

  console.log("\n=======================================================");
  console.log("🎉 Account seeded successfully!");
  console.log("=======================================================");
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${rawPassword}`);
  console.log("=======================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
