import { DEFAULT_CATEGORIES, normalizeAlias } from "@resource-manager/shared";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const roles = [
  {
    description: "Workspace owner with full access to configuration and data.",
    key: "OWNER",
    name: "Owner",
  },
  {
    description: "Administrator with elevated access to workspace operations.",
    key: "ADMIN",
    name: "Administrator",
  },
  {
    description: "Standard member with access to their finance data.",
    key: "USER",
    name: "User",
  },
] as const;

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        description: role.description,
        name: role.name,
      },
      create: role,
    });
  }

  for (const seed of DEFAULT_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: seed.slug },
      update: {
        color: seed.color,
        dashboardGroup: seed.dashboardGroup,
        icon: seed.icon,
        isActive: true,
        name: seed.name,
      },
      create: {
        color: seed.color,
        dashboardGroup: seed.dashboardGroup,
        icon: seed.icon,
        name: seed.name,
        slug: seed.slug,
      },
    });

    for (const alias of seed.aliases) {
      await prisma.categoryAlias.upsert({
        where: { normalizedAlias: normalizeAlias(alias) },
        update: {
          alias,
          categoryId: category.id,
        },
        create: {
          alias,
          categoryId: category.id,
          normalizedAlias: normalizeAlias(alias),
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
