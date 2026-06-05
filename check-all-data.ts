import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllData() {
  try {
    console.log('📊 Перевірка всіх таблиць в базі даних:\n');

    // Count for all tables
    const users = await prisma.user.count();
    const expenses = await prisma.expense.count();
    const incomes = await prisma.income.count();
    const budgets = await prisma.budget.count();
    const goals = await prisma.goal.count();
    const categories = await prisma.category.count();
    const accounts = await prisma.financialAccount.count();
    const sessions = await prisma.userSession.count();
    const auditLogs = await prisma.auditLog.count();

    console.log(`Users (Користувачи):          ${users}`);
    console.log(`Expenses (Витрати):            ${expenses}`);
    console.log(`Incomes (Доходи):              ${incomes}`);
    console.log(`Budgets (Бюджети):             ${budgets}`);
    console.log(`Goals (Цілі):                  ${goals}`);
    console.log(`Categories (Категорії):        ${categories}`);
    console.log(`Financial Accounts (Рахунки):  ${accounts}`);
    console.log(`Sessions (Сесії):              ${sessions}`);
    console.log(`Audit Logs (Логи):             ${auditLogs}`);

    console.log('\n---\n');

    if (users > 0) {
      console.log('Дані по користувачам:');
      const allUsers = await prisma.user.findMany({
        select: { 
          id: true, 
          email: true, 
          name: true, 
          createdAt: true,
          _count: {
            select: {
              expenses: true,
              incomes: true,
              budgets: true,
              goals: true,
              categories: true,
              accounts: true,
            }
          }
        },
      });
      
      allUsers.forEach(u => {
        console.log(`\n📧 ${u.email} (${u.name})`);
        console.log(`   - Витрат: ${u._count.expenses}`);
        console.log(`   - Доходів: ${u._count.incomes}`);
        console.log(`   - Бюджетів: ${u._count.budgets}`);
        console.log(`   - Цілей: ${u._count.goals}`);
        console.log(`   - Категорій: ${u._count.categories}`);
        console.log(`   - Рахунків: ${u._count.accounts}`);
        console.log(`   - Створено: ${u.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Помилка:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
