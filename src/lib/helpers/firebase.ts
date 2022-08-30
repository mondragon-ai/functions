import * as admin from "firebase-admin";
import { Customer } from "../types/customers";

/**
 * Get the data to be changed from the request object and handle to return {[key]: value} pairs. 
 * @param REQUEST_DATA: string
 * @return {} Customer! w/ only keys to be changed
 */
export const handleDataToChange = (REQUEST_DATA: any[][]): any => {
  let data: Customer = {};

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