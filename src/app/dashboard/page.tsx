
import { getProducts } from './products/actions'
import { getSalesHistory } from './reports/actions'
import { getExpenseCategories, getGlobalSettings } from './settings/actions'
import { SalesClientPage } from './sales-client-page'

export default async function SalesPage() {
  const [products, sales, categories, settings] = await Promise.all([
    getProducts(),
    getSalesHistory(),
    getExpenseCategories(),
    getGlobalSettings(),
  ]);
  return <SalesClientPage products={products} sales={sales} categories={categories} defaultDiscount={settings.defaultDiscount} />
}
