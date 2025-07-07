
import { getProducts } from "../products/actions";
import { StockOpnameClientPage } from "./stock-opname-client-page";

export default async function StockOpnamePage() {
  const products = await getProducts();
  return <StockOpnameClientPage initialProducts={products} />;
}
