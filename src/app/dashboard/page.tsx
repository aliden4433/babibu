
import { getProducts } from './products/actions'
import { getSalesHistory } from './reports/actions'
import { getExpenseCategories } from './settings/actions'
import { SalesClientPage } from './sales-client-page'

export default async function SalesPage() {
  const [products, sales, categories] = await Promise.all([
    getProducts(),
    getSalesHistory(),
    getExpenseCategories(),
  ]);
  return <SalesClientPage products={products} sales={sales} categories={categories} />
}
