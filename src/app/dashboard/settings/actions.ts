
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExpenseCategoryDoc } from "@/lib/types";

const CATEGORIES_COLLECTION = "expense_categories";

export async function getExpenseCategories(): Promise<ExpenseCategoryDoc[]> {
  const categoriesCol = collection(db, CATEGORIES_COLLECTION);
  const q = query(categoriesCol, orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as ExpenseCategoryDoc)
  );
  return list;
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
        // Daftar semua koleksi yang ingin di-reset
        const collectionsToReset = ["products", "sales", "expenses", "scheduled_discounts", "expense_categories"];
        
        for (const collectionName of collectionsToReset) {
            await clearCollection(collectionName);
        }
        
        // Inisialisasi ulang jika perlu, misal: membuat counter
        const counterRef = doc(db, "counters", "sales");
        await addDoc(collection(db, "counters"), {});


        // Revalidasi semua path yang relevan
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/products");
        revalidatePath("/dashboard/sales-history");
        revalidatePath("/dashboard/expenses");
        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/discounts");

        return { success: true, message: "Semua data aplikasi berhasil direset." };
    } catch (error) {
        console.error("Error resetting all data: ", error);
        return { success: false, message: "Gagal mereset data aplikasi." };
    }
}
