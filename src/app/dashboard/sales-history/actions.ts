
'use server';

import { revalidatePath } from 'next/cache';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale, SaleItem } from '@/lib/types';

export type SaleUpdatePayload = {
  id: string;
  items: SaleItem[];
  discount: number;
  total: number;
  subtotal: number;
  profit: number;
  totalCost: number;
  date: string;
};

export async function updateSale(payload: SaleUpdatePayload) {
  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', payload.id);
      const originalSaleDoc = await transaction.get(saleRef);

      if (!originalSaleDoc.exists()) {
        throw new Error("Transaksi asli tidak ditemukan.");
      }
      const originalSale = originalSaleDoc.data() as Sale;
      originalSale.id = originalSaleDoc.id;

      // --- Stock adjustment logic ---
      const oldStockAdjustments: { [productId: string]: number } = {};
      originalSale.items.forEach(item => {
        if (item.productId) {
            oldStockAdjustments[item.productId] = (oldStockAdjustments[item.productId] || 0) + item.quantity;
        }
      });

      const newStockAdjustments: { [productId: string]: number } = {};
      payload.items.forEach(item => {
        if (item.productId) {
            newStockAdjustments[item.productId] = (newStockAdjustments[item.productId] || 0) + item.quantity;
        }
      });

      const allProductIds = new Set([...Object.keys(oldStockAdjustments), ...Object.keys(newStockAdjustments)]);

      for (const productId of allProductIds) {
        const productRef = doc(db, 'products', productId);
        const productDoc = await transaction.get(productRef);
        
        if (productDoc.exists()) {
            const oldQty = oldStockAdjustments[productId] || 0;
            const newQty = newStockAdjustments[productId] || 0;
            const diff = newQty - oldQty;

            if (diff !== 0) {
              const currentStock = productDoc.data().stock;
              const updatedStock = currentStock - diff;
              transaction.update(productRef, { stock: updatedStock });
            }
        } else {
            console.warn(`Product with ID ${productId} not found during sale update. Skipping stock adjustment.`);
        }
      }

      // --- Update the sale document ---
      transaction.update(saleRef, {
        items: payload.items,
        discount: payload.discount,
        total: payload.total,
        subtotal: payload.subtotal,
        profit: payload.profit,
        totalCost: payload.totalCost,
        date: payload.date,
      });
    });

    revalidatePath('/dashboard/sales-history');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/reports');

    return { success: true, message: 'Transaksi berhasil diperbarui.' };
  } catch (error) {
    console.error('Error updating sale: ', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui transaksi.';
    return { success: false, message: errorMessage };
  }
}

export async function deleteSale(sale: Sale) {
  if (!sale || !sale.id) {
    return { success: false, message: 'Data penjualan tidak valid.' };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', sale.id);

      const validItemsWithRefs = sale.items
        .filter(item => !!item.productId)
        .map(item => ({
          itemData: item,
          ref: doc(db, 'products', item.productId!),
        }));
      
      if (validItemsWithRefs.length > 0) {
        const productDocs = await Promise.all(
          validItemsWithRefs.map(x => transaction.get(x.ref))
        );
        
        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const { itemData, ref } = validItemsWithRefs[i];

          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock || 0;
            const newStock = currentStock + itemData.quantity;
            transaction.update(ref, { stock: newStock });
          }
        }
      }

      transaction.delete(saleRef);
    });

    revalidatePath('/dashboard/sales-history');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard');

    return { success: true, message: 'Transaksi berhasil dihapus dan stok dikembalikan.' };
  } catch (error) {
    console.error('Error deleting sale: ', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus transaksi.';
    return { success: false, message: errorMessage };
  }
}

export async function deleteSales(sales: Sale[]) {
    if (!sales || sales.length === 0) {
      return { success: false, message: 'Tidak ada transaksi yang dipilih.' };
    }
  
    try {
      await Promise.all(sales.map(sale => deleteSale(sale)));
  
      revalidatePath('/dashboard/sales-history');
      revalidatePath('/dashboard/products');
      revalidatePath('/dashboard/reports');
      revalidatePath('/dashboard');
  
      return { success: true, message: `${sales.length} transaksi berhasil dihapus dan stok dikembalikan.` };
    } catch (error) {
      console.error('Error deleting sales: ', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus beberapa transaksi.';
      return { success: false, message: errorMessage };
    }
}
