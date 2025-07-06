
'use server';
import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ScheduledDiscount } from '@/lib/types';

const DISCOUNTS_COLLECTION = 'scheduled_discounts';
const PRODUCTS_COLLECTION = 'products';

// Get all scheduled discounts
export async function getScheduledDiscounts(): Promise<ScheduledDiscount[]> {
  const discountsCol = collection(db, DISCOUNTS_COLLECTION);
  const q = query(discountsCol, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledDiscount));
  return list;
}

// Create a new scheduled discount
export async function createScheduledDiscount(discount: Omit<ScheduledDiscount, 'id' | 'isActive'>) {
    try {
        const docRef = await addDoc(collection(db, DISCOUNTS_COLLECTION), {
            ...discount,
            isActive: false, // Always start as inactive
        });
        revalidatePath('/dashboard/discounts');
        return { success: true, message: "Jadwal diskon berhasil dibuat.", id: docRef.id };
    } catch (error) {
        console.error("Error creating scheduled discount: ", error);
        return { success: false, message: "Gagal membuat jadwal diskon." };
    }
}

// Update a scheduled discount
export async function updateScheduledDiscount(id: string, discountData: Omit<ScheduledDiscount, 'id' | 'isActive'>) {
    try {
        const discountRef = doc(db, DISCOUNTS_COLLECTION, id);
        const discountSnap = await getDoc(discountRef);

        if (!discountSnap.exists()) {
            return { success: false, message: "Jadwal diskon tidak ditemukan." };
        }

        if (discountSnap.data().isActive) {
             return { success: false, message: "Tidak dapat mengedit diskon yang sedang aktif." };
        }
        
        await updateDoc(discountRef, discountData);
        revalidatePath('/dashboard/discounts');
        return { success: true, message: "Jadwal diskon berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating scheduled discount: ", error);
        return { success: false, message: "Gagal memperbarui jadwal diskon." };
    }
}

// Delete a scheduled discount
export async function deleteScheduledDiscount(id: string) {
    try {
        const discountRef = doc(db, DISCOUNTS_COLLECTION, id);
        const discountSnap = await getDoc(discountRef);
        if (discountSnap.exists() && discountSnap.data().isActive) {
            return { success: false, message: "Gagal menghapus. Harap nonaktifkan diskon terlebih dahulu." };
        }
        await deleteDoc(discountRef);
        revalidatePath('/dashboard/discounts');
        return { success: true, message: "Jadwal diskon berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting scheduled discount: ", error);
        return { success: false, message: "Gagal menghapus jadwal diskon." };
    }
}

// Activate a discount
export async function activateDiscount(discountId: string) {
    const discountRef = doc(db, DISCOUNTS_COLLECTION, discountId);
    const batch = writeBatch(db);

    try {
        const discountSnap = await getDoc(discountRef);
        if (!discountSnap.exists()) {
            throw new Error("Jadwal diskon tidak ditemukan.");
        }
        const discount = discountSnap.data() as ScheduledDiscount;

        if (discount.isActive) {
            return { success: false, message: "Diskon sudah aktif." };
        }

        // Update product prices
        for (const product of discount.products) {
            const productRef = doc(db, PRODUCTS_COLLECTION, product.productId);
            batch.update(productRef, { 
                price: product.discountPrice,
                originalPrice: product.originalPrice
            });
        }

        // Mark discount as active
        batch.update(discountRef, { isActive: true });

        await batch.commit();

        revalidatePath('/dashboard/discounts');
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard');
        return { success: true, message: `Diskon "${discount.name}" berhasil diaktifkan.` };
    } catch (error) {
        console.error("Error activating discount: ", error);
        return { success: false, message: "Gagal mengaktifkan diskon." };
    }
}

// Deactivate a discount
export async function deactivateDiscount(discountId: string) {
    const discountRef = doc(db, DISCOUNTS_COLLECTION, discountId);
    const batch = writeBatch(db);

    try {
        const discountSnap = await getDoc(discountRef);
        if (!discountSnap.exists()) {
            throw new Error("Jadwal diskon tidak ditemukan.");
        }
        const discount = discountSnap.data() as ScheduledDiscount;

        if (!discount.isActive) {
            return { success: false, message: "Diskon tidak sedang aktif." };
        }

        // Revert product prices
        for (const product of discount.products) {
            const productRef = doc(db, PRODUCTS_COLLECTION, product.productId);
            batch.update(productRef, { 
                price: product.originalPrice,
                originalPrice: null
            });
        }

        // Mark discount as inactive
        batch.update(discountRef, { isActive: false });

        await batch.commit();

        revalidatePath('/dashboard/discounts');
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard');
        return { success: true, message: `Diskon "${discount.name}" berhasil dinonaktifkan.` };
    } catch (error) {
        console.error("Error deactivating discount: ", error);
        return { success: false, message: "Gagal menonaktifkan diskon." };
    }
}
