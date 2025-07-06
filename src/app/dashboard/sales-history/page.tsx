import { getExpenses } from "../expenses/actions";
import { getProducts } from "../products/actions";
import { getSalesHistory } from "../reports/actions";
import { SalesHistoryList } from "./sales-history-list";

export default async function SalesHistoryPage() {
  const sales = await getSalesHistory();
  const expenses = await getExpenses();
  const products = await getProducts();
  return <SalesHistoryList sales={sales} expenses={expenses} products={products} />;
}
