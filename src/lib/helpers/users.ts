import { createDocument } from "../../firebase";
import * as functions from "firebase-functions"

  export const addNewUserToPrimaryDB = async (FB_UUID: string,  user_data: any[]) => {
  const f: string = "QilaBD5FGdnF9iX5K9k7"
  let d: any[] = [
    {
    id: crypto.randomUUID(),
    first_name: "Obi",
    last_name: "Kanobi",
    name: "Obi Kanobi",
    scopes: "all",
    password: "sha256(passwrod + email)"

    }
  ]

  try {
    const result = await createDocument("merchants", f, "users", {users: d})
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