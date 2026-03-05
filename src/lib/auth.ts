import {
    createUserWithEmailAndPassword,
    signOut as fbSignOut,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";

export { auth };

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return fbSignOut(auth);
}
