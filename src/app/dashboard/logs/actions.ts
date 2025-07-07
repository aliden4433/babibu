
'use server';

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import type { ActivityLog, AppUser } from '@/lib/types';

const LOGS_COLLECTION = 'activity_logs';

export async function getLogs(): Promise<ActivityLog[]> {
  try {
    const logsCol = collection(db, LOGS_COLLECTION);
    const q = query(logsCol, orderBy('timestamp', 'desc'));
    const logSnapshot = await getDocs(q);
    const logList = logSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ActivityLog)
    );
    console.log(`[getLogs] Fetched ${logList.length} logs successfully.`);
    return logList;
  } catch (error) {
    console.error("Error fetching logs from Firestore: ", error);
    return [];
  }
}

export async function logActivity(
  user: AppUser | null,
  action: string,
  details: string
): Promise<{ success: boolean }> {
  if (!user?.uid || !user.email) {
    console.warn('Log activity skipped: user information is missing.');
    return { success: false };
  }
  try {
    await addDoc(collection(db, LOGS_COLLECTION), {
      timestamp: new Date().toISOString(),
      user: {
        uid: user.uid,
        email: user.email,
      },
      action,
      details,
    });
    revalidatePath('/dashboard/logs');
    return { success: true };
  } catch (error) {
    console.error('Failed to log activity:', error);
    return { success: false };
  }
}
