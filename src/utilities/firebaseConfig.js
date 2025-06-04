// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore

// Your Firebase config (use your own credentials from the Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyAtTYK_FCvQnIZKUzYVFdT7AVzHep7A7jg",
    authDomain: "agrisaviya-8d38b.firebaseapp.com",
    projectId: "agrisaviya-8d38b",
    storageBucket: "agrisaviya-8d38b.appspot.com", // Match TS file storage bucket
    messagingSenderId: "616360677214",
    appId: "1:616360677214:web:d1f81e88a83cf9c557c9cf",
    measurementId: "G-K8GDC8SJEE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Create a disabled mock storage object
const storage = {
    _unavailable: true,
    app,
    maxUploadRetryTime: 0,
    maxOperationRetryTime: 0,
    ref: () => ({}),
    refFromURL: () => ({}),
    setMaxUploadRetryTime: () => {},
    setMaxOperationRetryTime: () => {}
};

console.log("Firebase Storage is disabled as requested");

// Helper function to upload files to Firebase Storage - this will always throw an error
export const uploadFile = async (filePath, fileBlob) => {
    console.log("Storage functionality is disabled");
    throw new Error("Storage service is disabled as requested");
};

// Export Firestore, Auth and Storage
export { db, auth, storage };