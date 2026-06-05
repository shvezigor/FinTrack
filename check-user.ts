import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Search for the user
    const user = await prisma.user.findUnique({
      where: { email: 'shvezigor@gmail.com' },
      include: {
        preferences: true,
        subscription: true,
        passwordCredential: true,
        expenses: { take: 5 },
        accounts: true,
        categories: true,
      },
    });

    if (user) {
      console.log('✅ Користувач ЗНАЙДЕНО!');
      console.log('');
      console.log('Інформація про користувача:');
      console.log(`- ID: ${user.id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Ім'я: ${user.name}`);
      console.log(`- Створено: ${user.createdAt}`);
      console.log(`- Оновлено: ${user.updatedAt}`);
      console.log('');
      
      console.log('Підписка:');
      console.log(`- Статус: ${user.subscription?.status}`);
      console.log(`- Рівень: ${user.subscription?.tier}`);
      console.log('');

      console.log('Налаштування:');
      console.log(`- Мова: ${user.preferences?.locale}`);
      console.log(`- Часовий пояс: ${user.preferences?.timezone}`);
      console.log(`- Валюта: ${user.preferences?.currencyCode}`);
      console.log('');

      console.log('Дані:');
      console.log(`- Залікових записів: ${user.accounts?.length || 0}`);
      console.log(`- Категорій: ${user.categories?.length || 0}`);
      console.log(`- Витрат (перших 5): ${user.expenses?.length || 0}`);
      console.log('');

      // Count all expenses
      const expenseCount = await prisma.expense.count({
        where: { userId: user.id },
      });
      console.log(`- ВСЬОГО ВИТРАТ: ${expenseCount}`);

      // Count incomes
      const incomeCount = await prisma.income.count({
        where: { userId: user.id },
      });
      console.log(`- ВСЬОГО ДОХОДІВ: ${incomeCount}`);

      // Count budgets
      const budgetCount = await prisma.budget.count({
        where: { userId: user.id },
      });
      console.log(`- ВСЬОГО БЮДЖЕТІВ: ${budgetCount}`);

      // Count goals
      const goalCount = await prisma.goal.count({
        where: { userId: user.id },
      });
      console.log(`- ВСЬОГО ЦІЛЕЙ: ${goalCount}`);

    } else {
      console.log('❌ Користувач НЕ ЗНАЙДЕНО!');
      console.log('');
      console.log('Доступні користувачі в базі:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true, createdAt: true },
      });
      
      if (allUsers.length === 0) {
        console.log('  (база даних пуста - немає користувачів)');
      } else {
        allUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.name})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Помилка при підключенні до БД:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
