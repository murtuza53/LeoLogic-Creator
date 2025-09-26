'use client';
    
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { createUserProfile } from '@/lib/firebase';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in with redirect. */
export function initiateGoogleSignIn(auth: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
}

/**
 * Handles the result from a sign-in with redirect operation.
 * To be called on the page where the user is redirected back to.
 * Returns the signed-in user's credential, or null if no redirect operation was in progress.
 */
export async function handleRedirectResult(auth: Auth) {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // This is the signed-in user
      const user = result.user;
      
      // If it's a new user, create their profile
      const isNewUser = result.operationType === 'signIn' && (await getRedirectResult(auth));

      if (isNewUser && user.displayName && user.email) {
        // Check if profile exists before creating
        try {
            await createUserProfile(user.uid, { name: user.displayName, email: user.email });
        } catch (error) {
            // Profile might already exist, which is fine. Log for debugging.
            console.log("Profile might already exist, sign-in successful.");
        }
      }
      return user;
    }
  } catch (error) {
    console.error("Error during Google sign-in redirect:", error);
  }
  return null;
}

/** Sign out the current user. */
export function signOutUser(authInstance: Auth): void {
  signOut(authInstance);
}
