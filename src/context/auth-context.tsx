'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import type { AppUser } from '@/lib/types';


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Force every user to have the admin role for UI purposes
          setUser({ uid: firebaseUser.uid, ...userDoc.data(), role: 'admin' } as AppUser);
        } else {
          // If user exists in Auth but not in Firestore, create them as admin (for legacy users)
          const newUserProfile: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'admin',
          };
          await setDoc(userRef, newUserProfile);
          setUser(newUserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    const pathIsPublic = publicRoutes.includes(pathname);
    
    if (!user && pathIsProtected) {
      router.replace('/login');
    }

    if (user && pathIsPublic) {
      router.replace('/dashboard');
    }

  }, [user, loading, pathname, router]);


  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null); // Clear user state immediately
    router.push('/login');
  };

  if (loading && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
