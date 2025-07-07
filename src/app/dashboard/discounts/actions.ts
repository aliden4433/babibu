
'use server';
import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ScheduledDiscount, Product } from '@/lib/types';

const DISCOUNTS_COLLECTION = 'scheduled_discounts';
const PRODUCTS_COLLECTION = 'products';

// Get all scheduled discounts
export async function getScheduledDiscounts(): Promise<ScheduledDiscount[]> {
  try {
    const discountsCol = collection(db, DISCOUNTS_COLLECTION);
    const q = query(discountsCol, orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledDiscount));
    console.log(`[getScheduledDiscounts] Fetched ${list.length} discounts successfully.`);
    return list;
  } catch (error) {
    console.error("Error fetching scheduled discounts from Firestore: ", error);
    return [];
  }
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
    const discountRef = doc(db, DISCOUNTS_COLLECTION, id);

    try {
        const discountSnap = await getDoc(discountRef);
        if (!discountSnap.exists()) {
            return { success: false, message: "Jadwal diskon tidak ditemukan." };
        }

        const discount = discountSnap.data() as ScheduledDiscount;

        // Prevent deletion of an active discount
        if (discount.isActive) {
            return { success: false, message: "Diskon yang sedang aktif tidak dapat dihapus. Nonaktifkan terlebih dahulu." };
        }

        // If it's not active, just delete it. Prices are reverted on deactivation.
        await deleteDoc(discountRef);

        revalidatePath('/dashboard/discounts');
        return { success: true, message: "Jadwal diskon berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting scheduled discount: ", error);
        return { success: false, message: "Gagal menghapus jadwal diskon." };
    }
}


// Duplicate a scheduled discount
export async function duplicateScheduledDiscount(id: string) {
    try {
        const discountRef = doc(db, DISCOUNTS_COLLECTION, id);
        const discountSnap = await getDoc(discountRef);

        if (!discountSnap.exists()) {
            return { success: false, message: "Jadwal diskon tidak ditemukan." };
        }

        const originalDiscount = discountSnap.data() as Omit<ScheduledDiscount, 'id'>;

        const newDiscountData = {
            ...originalDiscount,
            name: `${originalDiscount.name} - Salinan`,
            isActive: false, // Duplicated discount is always inactive
        };
        
        await addDoc(collection(db, DISCOUNTS_COLLECTION), newDiscountData);
        revalidatePath('/dashboard/discounts');
        return { success: true, message: "Jadwal diskon berhasil diduplikasi." };
    } catch (error) {
        console.error("Error duplicating scheduled discount: ", error);
        return { success: false, message: "Gagal menduplikasi jadwal diskon." };
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

        // Get all product documents to read their current state
        const productRefs = discount.products.map(p => doc(db, PRODUCTS_COLLECTION, p.productId));
        const productSnaps = await Promise.all(productRefs.map(ref => getDoc(ref)));

        // Prepare batch updates
        for (const productSnap of productSnaps) {
            if (productSnap.exists()) {
                const productData = productSnap.data() as Product;
                // The price to revert to is stored in the product's `originalPrice` field.
                const priceToRevertTo = productData.originalPrice;

                // Only revert if there's an original price to revert to.
                if (priceToRevertTo != null) {
                    batch.update(productSnap.ref, { 
                        price: priceToRevertTo,
                        originalPrice: null
                    });
                }
            }
            // If product doesn't exist, we just ignore it. No update is added to the batch.
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
