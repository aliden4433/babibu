
"use server";

import { revalidatePath } from "next/cache";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExpenseCategoryDoc } from "@/lib/types";

const CATEGORIES_COLLECTION = "expense_categories";

export async function getExpenseCategories(): Promise<ExpenseCategoryDoc[]> {
  try {
    const categoriesCol = collection(db, CATEGORIES_COLLECTION);
    const q = query(categoriesCol, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ExpenseCategoryDoc)
    );
    console.log(`[getExpenseCategories] Fetched ${list.length} categories successfully.`);
    return list;
  } catch (error) {
    console.error("Error fetching expense categories from Firestore: ", error);
    return [];
  }
}

export async function addExpenseCategory(name: string) {
  try {
    const categoriesCol = collection(db, CATEGORIES_COLLECTION);
    await addDoc(categoriesCol, { name, descriptions: [] });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil ditambahkan." };
  } catch (error) {
    console.error("Error adding expense category: ", error);
    return { success: false, message: "Gagal menambahkan kategori." };
  }
}

export async function updateExpenseCategory(id: string, data: { name?: string; descriptions?: string[] }) {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(categoryRef, data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil diperbarui." };
  } catch (error) {
    console.error("Error updating expense category: ", error);
    return { success: false, message: "Gagal memperbarui kategori." };
  }
}

export async function deleteExpenseCategory(id: string) {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(categoryRef);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
    return { success: true, message: "Kategori berhasil dihapus." };
  } catch (error) {
    console.error("Error deleting expense category: ", error);
    return { success: false, message: "Gagal menghapus kategori. Pastikan tidak ada pengeluaran yang menggunakan kategori ini." };
  }
}

async function clearCollection(collectionName: string) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(query(collectionRef));
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

export async function resetAllData() {
    try {
        // Daftar semua koleksi yang ingin di-reset, termasuk counters dan logs
        const collectionsToReset = ["products", "sales", "expenses", "scheduled_discounts", "expense_categories", "counters", "activity_logs"];
        
        for (const collectionName of collectionsToReset) {
            await clearCollection(collectionName);
        }
        
        // Inisialisasi ulang counter penjualan dengan benar menggunakan setDoc
        const salesCounterRef = doc(db, "counters", "sales");
        await setDoc(salesCounterRef, { count: 0 });

        // Revalidasi semua path yang relevan
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/products");
        revalidatePath("/dashboard/sales-history");
        revalidatePath("/dashboard/expenses");
        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/discounts");
        revalidatePath("/dashboard/logs");

        return { success: true, message: "Semua data aplikasi berhasil direset." };
    } catch (error) {
        console.error("Error resetting all data: ", error);
        return { success: false, message: "Gagal mereset data aplikasi." };
    }
}
