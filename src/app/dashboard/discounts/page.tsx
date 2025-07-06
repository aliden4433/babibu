
import { getScheduledDiscounts } from "./actions";
import { DiscountsClientPage } from "./discounts-client-page";
import { getProducts } from "../products/actions";

export default async function DiscountsPage() {
  const discounts = await getScheduledDiscounts();
  const products = await getProducts(); // Needed for the form
  return <DiscountsClientPage initialDiscounts={discounts} products={products} />;
}
