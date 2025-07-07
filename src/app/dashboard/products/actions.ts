
"use server"

import { revalidatePath } from "next/cache"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/types"

export async function getProducts(): Promise<Product[]> {
  try {
    const productsCol = collection(db, "products")
    const q = query(productsCol, orderBy("name", "asc"));
    const productSnapshot = await getDocs(q)
    const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
    console.log(`[getProducts] Fetched ${productList.length} products successfully from Firestore.`);
    return productList
  } catch (error) {
    console.error("Error fetching products from Firestore: ", error);
    return [];
  }
}

export async function addProduct(product: Omit<Product, "id">) {
  try {
    const productsCol = collection(db, "products")
    await addDoc(productsCol, product)
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    return { success: true, message: "Produk berhasil ditambahkan." }
  } catch (error) {
    console.error("Error adding product: ", error)
    return { success: false, message: "Gagal menambahkan produk." }
  }
}

export async function addProductsBatch(products: Omit<Product, "id">[]) {
  try {
    const batch = writeBatch(db);
    const productsCol = collection(db, "products");
    
    products.forEach(product => {
      const docRef = doc(productsCol);
      batch.set(docRef, product);
    });
    
    await batch.commit();
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard")
    return { success: true, message: `${products.length} produk berhasil diimpor.` };
  } catch (error) {
    console.error("Error importing products: ", error);
    return { success: false, message: "Gagal mengimpor produk." };
  }
}

export async function duplicateProduct(product: Omit<Product, "id">) {
  try {
    const productsCol = collection(db, "products")
    const newProduct = { ...product, name: `${product.name} - Salinan` }
    await addDoc(productsCol, newProduct)
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    return { success: true, message: "Produk berhasil diduplikasi." }
  } catch (error) {
    console.error("Error duplicating product: ", error)
    return { success: false, message: "Gagal menduplikasi produk." }
  }
}

export async function updateProduct(id: string, product: Omit<Product, "id">) {
  try {
    const productRef = doc(db, "products", id)
    await updateDoc(productRef, product)
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    return { success: true, message: "Produk berhasil diperbarui." }
  } catch (error) {
    console.error("Error updating product: ", error)
    return { success: false, message: "Gagal memperbarui produk." }
  }
}

export async function deleteProduct(id: string) {
  try {
    const productRef = doc(db, "products", id)
    await deleteDoc(productRef)
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    return { success: true, message: "Produk berhasil dihapus." }
  } catch (error) {
    console.error("Error deleting product: ", error)
    return { success: false, message: "Gagal menghapus produk." }
  }
}

export async function deleteProducts(ids: string[]) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const productRef = doc(db, "products", id);
      batch.delete(productRef);
    });
    await batch.commit();
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard")
    return { success: true, message: `${ids.length} produk berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting products: ", error);
    return { success: false, message: "Gagal menghapus produk." };
  }
}


export async function updateProductsBatch(ids: string[], data: Partial<Omit<Product, "id">>) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const productRef = doc(db, "products", id);
      batch.update(productRef, data);
    });
    await batch.commit();
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard")
    return { success: true, message: `${ids.length} produk berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating products: ", error);
    return { success: false, message: "Gagal memperbarui produk." };
  }
}
