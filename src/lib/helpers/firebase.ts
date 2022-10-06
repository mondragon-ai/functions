import * as admin from "firebase-admin";
import { createDocument, updateDocument } from "../../firebase";
import { Customer } from "../types/customers";
import { Address } from "../types/orders";
import { EcomReturn } from "../types/stripe";

/**
 * Get the data to be changed from the request object and handle to return {[key]: value} pairs. 
 * @param REQUEST_DATA: string
 * @return {} Customer! w/ only keys to be changed
 */
export const handleDataToChange = (REQUEST_DATA: any[][]): any => {
  let data: Customer = {};

  console.log(REQUEST_DATA)

  // loop through data to push and create customer object
  REQUEST_DATA.forEach((v, i) => {
    data = {
      ...data,
      [v[0]]: v[1]
    }
  });

  // Update with Timestamp
  data = {
    ...data,
    updated_at: admin.firestore.Timestamp.now(),
  }

  return data;

}

/**
 * Create
 * @param FB_MERCHANT_UUID 
 * @param data 
 * @param prefix 
 * @returns 
 */
export const createNewDocumentWithId = async (
  FB_MERCHANT_UUID: string,
  subCollection: string,
  prefix: string,
  data: any,
): Promise<EcomReturn> => {
  // data to send back to client 
  let text: string = "", status: number = 500;
  let FB_CUSTOMER_UUID: string = "";

  try {
    // Create NEW /customers/document
    FB_CUSTOMER_UUID = await createDocument(
      "merchants",
      FB_MERCHANT_UUID,
      subCollection, "",
      data
    );

  } catch (e) {
    text =  "ERROR: Creating new document in primary DB 💩"; 
  }

  try {
    // Update Documents if UUID exists.
    if (FB_CUSTOMER_UUID != "") {
      await updateDocument(
        {
          id: `${prefix}${FB_CUSTOMER_UUID}`
        },
        "merchants",
        FB_MERCHANT_UUID,
        subCollection,
        FB_CUSTOMER_UUID
      );
      status = 200,
      text = "SUCCESS: Docment created & added with ID to primary DB 🧙🏼‍♂️. => " + prefix + FB_CUSTOMER_UUID;
    } 

  } catch (e) {
    text = " Updating the document in primary DB 🆕. ";

  }

  return {
    text: text,
    status: status,
    data: {
      document_id: FB_CUSTOMER_UUID
    }
  }
};

export const updateAddressWithID = (
  address_uuid: string,
  data: any,
  update_data: any,
): Address[] => {
  let addresses: Address[] = data?.addresses || [];
  let addresWithId: Address[] = []

  if (addresses?.length != 0) {
    addresses?.forEach((v, i) => {
      // Find address & add NEW data but appended to current state
      if (v.id == address_uuid) {
        addresWithId =  [
          ...addresWithId,
          {
            ...v,
            id: v.id,
            ...update_data
          }
        ]
      } else {
        // Move the old addresses unchanged
        addresWithId = [
          ...addresWithId,
          {...v},
        ]
      }
    });
  } 

  return addresWithId;
};