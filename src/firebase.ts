// Imports
import * as admin from "firebase-admin";

// Initalize FB APP
const firebase = admin.initializeApp()

// Initalize Firestore DB - Primary
const firestoreDB: FirebaseFirestore.Firestore = firebase.firestore();

firestoreDB.settings({
  timestampInSnapshot: true
})

// Export DB 
export const db: FirebaseFirestore.Firestore = firestoreDB;

/**
 * Create a NEW document in primary DB
 * 
 * @param collection 
 * @param documenID 
 * @param subCollection? 
 * @param data?
 * @returns 
 */
export const createDocument = async (collection: string, documenID: string, subCollection: string, data?: any) => {


  // Subcolleciton 1 depth
  if (documenID !== "") {
    const docRef = await db.collection(collection).doc(documenID).collection(subCollection).add(data);
    return docRef.id;
  }

  // Only One Path
  const docRef = await db.collection(collection).add(data);
  return docRef.id;

}   


/**
 * Update a MERCHANT document in primary DB. NON SUBCOLLECTION
 * 
 * @param collection 
 * @param documenID
 * @param collection 
 * @param subCollection
 * @param subDocumenID
 * @param data
 * @returns 
 */
 export const updateDocument = async (
    data: any,
    collection: string,
    documenID: string,
    subCollection: string,
    subDocumenID: string,
) => {

  let docRef = db.collection(collection).doc(documenID);

  if (subCollection != "") {
    docRef = db.collection(collection).doc(documenID).collection(subCollection).doc(subDocumenID);
  }

  await docRef.set(data, { merge: true });
  
}   

/**
 * Get a MERCHANT document in primary DB. NON SUBCOLLECTION
 * 
 * @param collection 
 * @param documenID
 * @param collection 
 * @param subCollection
 * @param subDocumenID
 * @param data
 * @returns 
 */
 export const getDocument = async (
    collection: string,
    documenID: string,
    subCollection: string,
    subDocumenID: string,
) => {

  const docRef = await db.collection(collection).doc(documenID).get();

  if (docRef.exists) {
    return await docRef.data();
  }

  return
  
}   

// TODO: Initialize Storage Bucket
// TODO: Export Storage Bucket 

// TODO: Initialize Realtime DB - Secondary
// TODO: Export Realtime DB - Secondary
