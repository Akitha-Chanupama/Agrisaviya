// firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
// Import but don't use getStorage
import { getStorage } from 'firebase/storage';

// Define a custom storage interface with our added properties
interface CustomStorage {
  _unavailable: boolean;
  app: any;
  maxUploadRetryTime: number;
  maxOperationRetryTime: number;
  ref: (path?: string) => any;
  refFromURL: (url: string) => any;
  setMaxUploadRetryTime: (time: number) => void;
  setMaxOperationRetryTime: (time: number) => void;
}

// Your Firebase config (use your own credentials from the Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyAtTYK_FCvQnIZKUzYVFdT7AVzHep7A7jg",
    authDomain: "agrisaviya-8d38b.firebaseapp.com",
    projectId: "agrisaviya-8d38b",
    storageBucket: "agrisaviya-8d38b.appspot.com",
    messagingSenderId: "616360677214",
    appId: "1:616360677214:web:d1f81e88a83cf9c557c9cf",
    measurementId: "G-K8GDC8SJEE"
};

// Initialize Firebase (preventing multiple initializations)
let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Authentication
const auth: Auth = getAuth(app);

// Create a disabled mock storage implementation
const disabledStorage: CustomStorage = {
    _unavailable: true,
    app,
    maxUploadRetryTime: 0,
    maxOperationRetryTime: 0,
    ref: () => ({
        put: () => Promise.reject(new Error("Storage service is not available")),
        putString: () => Promise.reject(new Error("Storage service is not available")),
        getDownloadURL: () => Promise.reject(new Error("Storage service is not available"))
    }),
    refFromURL: () => ({
        getDownloadURL: () => Promise.reject(new Error("Storage service is not available"))
    }),
    setMaxUploadRetryTime: () => {},
    setMaxOperationRetryTime: () => {}
};

// Use the disabled storage mock instead of actual Firebase Storage
const storage = disabledStorage;

console.log("Firebase Storage is disabled as requested");

// Helper function to upload files to Firebase Storage - this will always throw an error
export const uploadFile = async (filePath: string, fileBlob: Blob): Promise<string> => {
    console.log("Storage functionality is disabled");
    throw new Error("Storage service is disabled as requested");
};

// Export Firebase services
export { db, auth, storage }; 