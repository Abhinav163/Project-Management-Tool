import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Firestore import

const firebaseConfig = {
    apiKey: "AIzaSyDuS695E8XqmzjD9DHAcwJesHFhwWw9b8E",
    authDomain: "project-management-tool-f75bd.firebaseapp.com",
    projectId: "project-management-tool-f75bd",
    storageBucket: "project-management-tool-f75bd.appspot.com",
    messagingSenderId: "373067913543",
    appId: "1:373067913543:web:4900e33722239c6c50d462",
    measurementId: "G-G8DK7X8R8W"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app); // Initialize Firestore

export { auth };