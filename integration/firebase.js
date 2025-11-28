import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDm8enBkM5BwRRTdcU68Jc17CPLYjolN04",
  authDomain: "chairopink-d5bd2.firebaseapp.com",
  projectId: "chairopink-d5bd2",
  storageBucket: "chairopink-d5bd2.appspot.com",
  messagingSenderId: "41199313951",
  appId: "1:41199313951:web:a690fade7c965d2671e12a",
  measurementId: "G-D14K4ST35D"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
