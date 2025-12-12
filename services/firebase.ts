
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDDv4HzrZ-Nz2biKIjaqVJQJ1H0NI_wCHA",
    authDomain: "classmos-c9eed.firebaseapp.com",
    projectId: "classmos-c9eed",
    storageBucket: "classmos-c9eed.firebasestorage.app",
    messagingSenderId: "763682109774",
    appId: "1:763682109774:web:31ed701427ec63c013461f",
    measurementId: "G-0VLGBCQXN8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
