
import { getExpenses } from "../expenses/actions";
import { getProducts } from "../products/actions";
import { getSalesHistory } from "../reports/actions";
import { SalesHistoryList } from "./sales-history-list";

export default async function SalesHistoryPage() {
  const [sales, expenses, products] = await Promise.all([
    getSalesHistory(),
    getExpenses(),
    getProducts(),
  ]);
  return <SalesHistoryList sales={sales} expenses={expenses} products={products} />;
}
