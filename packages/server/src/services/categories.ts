import { CategoryLookup, CATEGORY_TEMPLATES } from "@resource-manager/shared";
import { getDb } from "../db.js";

export async function getCategoryLookup(userId?: string | null): Promise<(CategoryLookup & { ownedByUser: boolean })[]> {
  const categories = await getDb().category.findMany({
    include: { aliases: true },
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
    },
  });

  const orderedCategories = userId
    ? [...categories].sort((a, b) => {
        const aOwned = a.userId === userId ? 0 : 1;
        const bOwned = b.userId === userId ? 0 : 1;
        return aOwned - bOwned || a.name.localeCompare(b.name, "uk");
      })
    : categories;

  return orderedCategories.map((category) => ({
    dashboardGroup: category.dashboardGroup,
    id: category.id,
    icon: category.icon,
    aliases: category.aliases.map((alias) => alias.alias),
    name: category.name,
    ownedByUser: category.userId === userId,
    slug: category.slug,
  }));
}

export async function getCategoryTemplates(userId?: string | null) {
  const userSlugs = new Set<string>();
  if (userId) {
    const owned = await getDb().category.findMany({
      select: { slug: true },
      where: { userId, isActive: true },
    });
    owned.forEach((c) => {
      const base = c.slug.replace(/-[a-z0-9]+$/, "");
      userSlugs.add(c.slug);
      userSlugs.add(base);
    });
  }
  return CATEGORY_TEMPLATES.filter((t) => !userSlugs.has(t.slug));
}

export async function importCategoryTemplates(userId: string, slugs: string[]) {
  const templates = CATEGORY_TEMPLATES.filter((t) => slugs.includes(t.slug));
  const created: string[] = [];
  for (const tpl of templates) {
    await getDb().category.create({
      data: {
        color: tpl.color,
        dashboardGroup: tpl.group,
        icon: tpl.icon,
        name: tpl.name,
        slug: `${tpl.slug}_${userId.slice(-6)}`,
        userId,
      },
    });
    created.push(tpl.slug);
  }
  return { created, count: created.length };
}

export async function getCategoryBySlug(slug: string) {
  return getDb().category.findUnique({ where: { slug } });
}
