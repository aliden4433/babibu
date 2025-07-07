
'use server';
import { revalidatePath } from 'next/cache';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function updateStockOpname(updates: { id: string; stock: number }[]) {
    const batch = writeBatch(db);

    updates.forEach(({ id, stock }) => {
        const productRef = doc(db, 'products', id);
        batch.update(productRef, { stock });
    });

    try {
        await batch.commit();
        revalidatePath('/dashboard/stock-opname');
        revalidatePath('/dashboard/products');
        return { success: true, message: `${updates.length} produk berhasil diperbarui stoknya.` };
    } catch (error) {
        console.error('Error updating stock opname:', error);
        return { success: false, message: 'Gagal memperbarui stok.' };
    }
}
