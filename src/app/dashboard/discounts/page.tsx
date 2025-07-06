
import { getProducts } from "../products/actions"
import { DiscountsClientPage } from "./discounts-client-page"

export default async function DiscountsPage() {
  const products = await getProducts()
  return <DiscountsClientPage products={products} />
}
