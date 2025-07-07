
import { getExpenses } from "../expenses/actions";
import { getProducts } from "../products/actions";
import { getSalesHistory } from "./actions";
import { ReportsClientPage } from "./reports-client-page";

export default async function ReportsPage() {
  const [products, sales, expenses] = await Promise.all([
    getProducts(),
    getSalesHistory(),
    getExpenses(),
  ]);

  return <ReportsClientPage initialSales={sales} products={products} initialExpenses={expenses} />;
}
