
import { getScheduledDiscounts } from "./actions";
import { DiscountsClientPage } from "./discounts-client-page";
import { getProducts } from "../products/actions";

export default async function DiscountsPage() {
  const [discounts, products] = await Promise.all([
    getScheduledDiscounts(),
    getProducts(), // Needed for the form
  ]);
  return <DiscountsClientPage initialDiscounts={discounts} products={products} />;
}
