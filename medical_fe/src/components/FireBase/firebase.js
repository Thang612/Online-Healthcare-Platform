import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, query, orderByChild, equalTo } from "firebase/database"; // Added query, orderByChild, equalTo

const firebaseConfig = {
  apiKey: "AIzaSyDX1roEz11r7IcFXQ1vhCuNIwHCbpBh1qQ",
  authDomain: "chat-app-34c20.firebaseapp.com",
  databaseURL: "https://quanlydiemrenluyen-c7fae-default-rtdb.firebaseio.com/", // Corrected URL
  projectId: "chat-app-34c20",
  storageBucket: "chat-app-34c20.appspot.com",
  messagingSenderId: "842572540869",
  appId: "1:842572540869:web:9872ec6842c4d369e2f9ac",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const database = getDatabase(app);

// Export necessary Firebase functions
export { database, ref, push, onValue, query, orderByChild, equalTo };
