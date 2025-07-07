'use server';

import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, CartItem } from '@/lib/types';

export async function addSale(saleData: {
  items: CartItem[]
  discountPercentage: number
  transactionDate: string
}) {
  try {
    const validItems = saleData.items.filter(item => item.product && item.product.id);
    
    if (validItems.length === 0) {
      throw new Error("Tidak ada item yang valid di keranjang untuk diproses.");
    }
    
    const subtotal = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = subtotal * (saleData.discountPercentage / 100);
    const total = subtotal - discountAmount;
    const totalCost = validItems.reduce((acc, item) => acc + (item.product.costPrice || 0) * item.quantity, 0);
    const profit = total - totalCost;

    await runTransaction(db, async (transaction) => {
      // 1. Get and increment the sales counter
      const counterRef = doc(db, "counters", "sales");
      const counterDoc = await transaction.get(counterRef);
      
      const currentCount = counterDoc.exists() ? counterDoc.data().count : 0;
      const newCount = currentCount + 1;
      const newTransactionId = `TRX-${String(newCount).padStart(5, '0')}`;
      
      // 2. READ all product documents first.
      const productRefs = validItems.map(item => doc(db, "products", item.product.id!));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      // 3. Now perform all WRITE operations.
      // First, create the sale document.
      const salesCol = collection(db, "sales");
      const saleRef = doc(salesCol);
      
      const saleToSave = {
        transactionId: newTransactionId,
        items: validItems.map(item => ({
          productId: item.product.id!,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.product.costPrice || 0,
        })),
        subtotal,
        discount: discountAmount,
        discountPercentage: saleData.discountPercentage,
        total,
        totalCost,
        profit,
        date: saleData.transactionDate,
      };
      transaction.set(saleRef, saleToSave);

      // Next, update the stock for each product.
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const productDoc = productDocs[i];
        const productRef = productRefs[i];

        if (!productDoc.exists()) {
          throw new Error(`Produk "${item.product.name}" tidak ditemukan.`);
        }

        const currentStock = productDoc.data().stock;
        const newStock = currentStock - item.quantity;

        transaction.update(productRef, { stock: newStock });
      }

      // Finally, update the counter
      transaction.set(counterRef, { count: newCount }, { merge: true });
    });
    
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/sales-history")

    const skippedItemsCount = saleData.items.length - validItems.length;
    const message = skippedItemsCount > 0 
        ? `Transaksi berhasil dicatat. ${skippedItemsCount} item diabaikan karena data tidak lengkap.`
        : "Transaksi berhasil dicatat.";

    return { success: true, message: message }
  } catch (error) {
    console.error("Error adding sale: ", error)
    const errorMessage = error instanceof Error ? error.message : "Gagal mencatat transaksi."
    return { success: false, message: errorMessage }
  }
}
