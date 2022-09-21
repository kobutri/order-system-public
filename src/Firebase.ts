// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, type User } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions, httpsCallable } from 'firebase/functions'
import { writable, type Writable } from "svelte/store";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  databaseURL: " "
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);
const sendConfirmationMail = httpsCallable<{
  from: string,
  entryName: string,
  attachment: string,
  to: string
}, unknown>(functions, 'sendConfirmationMail');
const user: Writable<User | null> = writable();
auth.onAuthStateChanged(newUser => {
  user.set(newUser);
})
const db = getDatabase(app);
export {
    auth,
    db,
    user,
    sendConfirmationMail
}