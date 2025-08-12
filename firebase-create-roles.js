import { getFirestore, collection, setDoc, doc } from "firebase/firestore";

// ...initialisation Firebase...

const db = getFirestore();

// Exemple pour créer une table "roles" et ajouter un rôle à un utilisateur
// Utilisez l'UID Firebase de l'utilisateur comme clé
await setDoc(doc(collection(db, "roles"), "USER_UID"), {
  email: "molo77@gmail.com",
  role: "admin"
});

// Pour ajouter d'autres rôles, répétez avec d'autres UID et rôles
