// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCCZjzMn8ijp0DLUBNWvzYrkEB528F-kA",
  authDomain: "fin-simulator-ae3fa.firebaseapp.com",
  projectId: "fin-simulator-ae3fa",
  storageBucket: "fin-simulator-ae3fa.firebasestorage.app",
  messagingSenderId: "118598955074",
  appId: "1:118598955074:web:1c99de31bedb4441e63ddb",
  measurementId: "G-E77DRV3BQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);