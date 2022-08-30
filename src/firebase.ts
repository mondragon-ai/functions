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
export const createDocument = async (
  collection: string,
  documenID: string,
  subCollection: string,
  subCollectionID: string,
  data?: any
) => {

  // Subcolleciton w/ ID
  if (subCollectionID !== "") {
    await db.collection(collection).doc(documenID).collection(subCollection).doc(subCollectionID).set(data);
    return subCollectionID;
  }

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


 console.log(data, collection, documenID, subCollection, subDocumenID)

  let docRef = db.collection(collection).doc(documenID);

  if (subCollection != "") {
    docRef = db.collection(collection).doc(documenID).collection(subCollection).doc(subDocumenID);
  }

  await docRef.set(data, {
    merge: true,
  });

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
 export const updateCustomerDocumentWithID = async (
  data: any,
  collection: string,
  documenID: string,
  subCollection: string,
  subDocumenID: string,
) => {

  console.log(data, collection, documenID, subCollection, subDocumenID)

  let docRef = db.collection(collection).doc(documenID).collection(subCollection).doc(subDocumenID);

  await docRef.update(data);

}  


/**
 * Update a subcollection document in primary DB. 
 * 
 * @param collection 
 * @param documenID
 * @param collection 
 * @param subCollection
 * @param subDocumenID
 * @param data
 * @returns 
 */
 export const updateSubcollectionDocumentWithID = async (
  data: any,
  collection: string,
  documenID: string,
  subCollection: string,
  subDocumenID: string,
) => {

  console.log(data, collection, documenID, subCollection, subDocumenID)

  let docRef = db.collection(collection).doc(documenID).collection(subCollection).doc(subDocumenID);

  await docRef.update(data);


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

  let docRef: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> = await db.collection(collection).doc(documenID).get();

  if (subDocumenID != "") {
    docRef = await db.collection(collection).doc(documenID).collection(subCollection).doc(subDocumenID).get();
  } 

  if (docRef.exists) {
    return await docRef.data();
  }

  return
  
};


/**
 * Get a COLLECTION document in primary DB. W/ SUBCOLLECTION && limit
 * @param collection 
 * @param documenID
 * @param collection 
 * @param subCollection
 * @returns 
 */
 export const getCollection = async (
  collection: string,
  documenID: string,
  subCollection: string,
) => {

let docRef: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData> = await db.collection(collection).limit(25).get();

if (subCollection != "") {
  docRef = await db.collection(collection).doc(documenID).collection(subCollection).limit(25).get();
} 

return docRef;

};

/**
 * Get a MERCHANT document in primary DB -- NON SUBCOLLECTION
 * 
 * @param shop 
 * @returns 
 */
 export const getDocumentByShop = async (
    shop: string,
) => {
  let MERCHANT_ID = "";
  const docs = await db.collection("merchants").where("shop", "==", shop).get();

  //TODO: Consier using logic to control ONLY one store instance
  console.log(docs.size);

  await docs.forEach((d)=> {console.log(d.data()); MERCHANT_ID = d.id;})

  return MERCHANT_ID;
}

/**
 * Get a MERCHANT/USER document from primary DB -- SUBCOLLECTION
 * 
 * @param user_id 
 * @param merchant_uuid 
 * @returns 
 */
 export const getUserDocumentByUserID = async (
  user_id: string,
  merchant_uuid: string,
) => {
  let USER_ID = "";
  const docs = await db.collection("merchants").doc(merchant_uuid).collection("users").where("id", "==", user_id).get();

  //TODO: Consier using logic to control ONLY one store instance
  console.log(docs.size);

  docs.forEach((d)=> {console.log(d.data()); USER_ID = d.id;})

  return USER_ID;

}


/**
 * Get a MERCHANT/USER document from primary DB -- SUBCOLLECTION
 * @param code 
 * @param merchant_uuid 
 * @returns 
 */
 export const getDiscountWithCode = async (
  code: string,
  merchant_uuid: string,
) => {
  let USER_ID = "";
  const docs = await db.collection("merchants").doc(merchant_uuid).collection("discounts").where("code", "==", code).get();

  //TODO: Consier using logic to control ONLY one store instance
  console.log(docs.size);

  await docs.forEach((d)=> {console.log(d.data()); USER_ID = d.id;})

  return USER_ID;

}

/**
 * Delete a USER document from primary DB -- SUBCOLLECTION
 * @param collection 
 * @param documentID 
 * @param subCollection 
 * @param subDocumentID
 * @returns 
 */
 export const deleteDocumentWithID = async (
  collection: string,
  documentID: string,
  subCollection?: string,
  subDocumentID?: string,
) => {

  console.log(collection, documentID, subCollection, subDocumentID);
  if (subCollection != "") {
    await db.collection(collection)
    .doc(documentID)
    .collection(subCollection || "")
    .doc(subDocumentID || "")
    .delete();

  } else {
    const docs = await db.collection(collection)
    .doc(documentID)
    .collection(subCollection || "")
    .doc(subDocumentID || "")
    .delete();

    console.log(docs);
  }

  
}


// TODO: Initialize Storage Bucket
// TODO: Export Storage Bucket 

// TODO: Initialize Realtime DB - Secondary
// TODO: Export Realtime DB - Secondary
