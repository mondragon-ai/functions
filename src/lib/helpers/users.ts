import { createDocument } from "../../firebase";
import * as functions from "firebase-functions"

/**
 * Add a User to the Merchant docuemnt --> /merchants/${merchant_id}/users/{{ GENERATED }}
 * 
 * @param FB_UUID 
 * @param user_data 
 * @returns return docuemnt (sub colleciton)  ID!
 */
export const addNewUserToPrimaryDB = async (FB_UUID: string,  user_data: {}) => {

  try {
    const result = await createDocument("merchants", FB_UUID, "users", "", user_data)
    return {
      status: 200,
      text: "SUCCESS: User succesfully created with the ID! of " + result,
    }
    
  } catch (e) {
    functions.logger.error("ERROR: Likley Internal -- Check Logs. ", e);
    return {
      status: 500,
      text: "ERROR: Likley Internal -- Check Logs. ",
    };
  }; 
};