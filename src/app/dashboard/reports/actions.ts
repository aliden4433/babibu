
"use server"

import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Sale } from "@/lib/types"

export async function getSalesHistory(): Promise<Sale[]> {
  try {
    const salesCol = collection(db, "sales")
    const q = query(salesCol, orderBy("date", "desc"));
    const salesSnapshot = await getDocs(q)
    const salesList = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale))
    console.log(`[getSalesHistory] Fetched ${salesList.length} sales successfully.`);
    return salesList
  } catch (error) {
    console.error("Error fetching sales history from Firestore: ", error);
    return [];
  }
}
