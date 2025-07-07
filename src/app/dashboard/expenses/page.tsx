
import { getExpenses } from "./actions";
import { ExpensesClientPage } from "./expenses-client-page";
import { getExpenseCategories } from "../settings/actions";

export default async function ExpensesPage() {
  const [expenses, categories] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
  ]);
  return <ExpensesClientPage initialExpenses={expenses} initialCategories={categories} />;
}
